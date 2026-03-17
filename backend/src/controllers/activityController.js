import { nanoid } from 'nanoid';
import supabase from '../supabase.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/activities');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const logAudit = async (req, action, resource, resourceId, details) => {
    try {
        const { error } = await supabase.from('audit_logs').insert([{
            user_id: req.user.id,
            action,
            resource,
            resource_id: resourceId,
            details,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        }]);
        if (error) console.error('Audit log error:', error);
    } catch (e) {
        console.error('Audit log exception:', e);
    }
};

export const getActivities = async (req, res) => {
    const { data, error } = await supabase.from('activities').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
};

export const createActivity = async (req, res) => {
    let { name, slots, cost, schedule, description, image, is_recurring, recurrence_days, start_time, end_time } = req.body || {};
    
    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Name required' });
    }

    // Handle Image Upload
    let imageUrl = image || '';
    if (req.file) {
        try {
            const filename = `${Date.now()}-${nanoid(6)}.webp`;
            const filepath = path.join(uploadDir, filename);
            
            await sharp(req.file.buffer)
                .resize(800, 600, { fit: 'cover', withoutEnlargement: false })
                .toFile(filepath);
                
            imageUrl = `/uploads/activities/${filename}`;
        } catch (e) {
            console.error('Error saving image:', e);
            return res.status(500).json({ error: 'Error saving image' });
        }
    }

    let activity = {
        id: crypto.randomUUID(), // Generate UUID manually as DB might not have default
        name: name.trim(),
        slots: parseInt(slots) || 0,
        cost: parseFloat(cost) || 0,
        schedule: schedule || '',
        description: description || '',
        image: imageUrl,
        created_at: new Date().toISOString()
    };

    // Recurrence Logic
    const isRecurringBool = is_recurring === 'true' || is_recurring === true;

    if (isRecurringBool) {
        if (recurrence_days && !Array.isArray(recurrence_days)) {
            recurrence_days = [recurrence_days];
        }

        if (!recurrence_days || recurrence_days.length === 0) {
            return res.status(400).json({ error: 'Recurrence days required for recurring activities' });
        }
        if (!start_time || !end_time) {
            return res.status(400).json({ error: 'Start and end time required for recurring activities' });
        }
        
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const invalidDays = recurrence_days.filter(d => !validDays.includes(d));
        if (invalidDays.length > 0) {
            return res.status(400).json({ error: `Invalid days: ${invalidDays.join(', ')}` });
        }

        activity.is_recurring = true;
        activity.recurrence_days = recurrence_days;
        activity.start_time = start_time;
        activity.end_time = end_time;
    } else {
        activity.is_recurring = false;
        activity.recurrence_days = null;
        activity.start_time = null;
        activity.end_time = null;
    }

    const { data, error } = await supabase.from('activities').insert([activity]).select('*').single();
    
    if (error) {
        console.error('Error creating activity:', error);
        return res.status(500).json({ error: error.message });
    }
    
    await logAudit(req, 'CREATE', 'activity', data.id, { name });
    res.status(201).json(data);
};

export const updateActivity = async (req, res) => {
    const { id } = req.params;
    let { name, slots, cost, schedule, description, image, is_recurring, recurrence_days, start_time, end_time } = req.body || {};
    
    if (name && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (slots !== undefined) updates.slots = parseInt(slots) || 0;
    if (cost !== undefined) updates.cost = parseFloat(cost) || 0;
    if (description) updates.description = description;

    // Handle Image Upload
    if (req.file) {
        try {
            const filename = `${Date.now()}-${nanoid(6)}.webp`;
            const filepath = path.join(uploadDir, filename);
            
            await sharp(req.file.buffer)
                .resize(800, 600, { fit: 'cover', withoutEnlargement: false })
                .toFile(filepath);
                
            updates.image = `/uploads/activities/${filename}`;
        } catch (e) {
            console.error('Error saving image:', e);
            return res.status(500).json({ error: 'Error saving image' });
        }
    } else if (image !== undefined) {
        updates.image = image;
    }

    // Recurrence Logic Update
    const isRecurringBool = is_recurring === 'true' || is_recurring === true;
    
    if (isRecurringBool) {
        if (recurrence_days && !Array.isArray(recurrence_days)) {
            recurrence_days = [recurrence_days];
        }

        if (recurrence_days) {
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const invalidDays = recurrence_days.filter(d => !validDays.includes(d));
            if (invalidDays.length > 0) {
                return res.status(400).json({ error: `Invalid days: ${invalidDays.join(', ')}` });
            }
            updates.recurrence_days = recurrence_days;
        }
        
        if (start_time) updates.start_time = start_time;
        if (end_time) updates.end_time = end_time;
        updates.is_recurring = true;
    } else if (is_recurring === 'false' || is_recurring === false) {
        updates.is_recurring = false;
        updates.recurrence_days = null;
        updates.start_time = null;
        updates.end_time = null;
    }

    const { data, error } = await supabase.from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    await logAudit(req, 'UPDATE', 'activity', id, { name });
    res.json(data);
};

export const enrollMember = async (req, res) => {
    const { id } = req.params; // Activity ID
    const { memberId } = req.body; // Member ID (could be user or family member)
    const userId = req.user.id;

    if (!memberId) {
        return res.status(400).json({ error: 'Member ID required' });
    }

    // Verify ownership (user can enroll self or their family members)
    // We treat user enrollment as memberId == userId (or checking if memberId is in family_members of userId)
    
    let targetMemberId = memberId;
    
    if (memberId !== userId) {
        const { data: familyMember, error: familyError } = await supabase
            .from('family_members')
            .select('id')
            .eq('id', memberId)
            .eq('parent_id', userId)
            .single();
        
        if (familyError || !familyMember) {
            // It might be the user trying to enroll themselves using their own ID which is fine
             if (memberId !== userId) {
                 return res.status(403).json({ error: 'Unauthorized: Can only enroll self or family members' });
             }
        }
    }

    // Check if already enrolled
    const { data: existing, error: checkError } = await supabase
        .from('activity_enrollments')
        .select('id')
        .eq('activity_id', id)
        .eq('member_id', targetMemberId)
        .maybeSingle();
    
    if (existing) {
        return res.status(400).json({ error: 'Member already enrolled in this activity' });
    }

    // Enroll
    const { data, error } = await supabase
        .from('activity_enrollments')
        .insert([{
            activity_id: id,
            member_id: targetMemberId,
            enrolled_by: userId,
            status: 'active',
            enrolled_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Enrollment error:', error);
        return res.status(500).json({ error: 'Failed to enroll' });
    }

    await logAudit(req, 'ENROLL', 'activity', id, { memberId: targetMemberId });
    res.status(201).json(data);
};

export const getEnrollments = async (req, res) => {
    const userId = req.user.id;
    
    // Get enrollments for user and their family
    const { data: family } = await supabase.from('family_members').select('id').eq('parent_id', userId);
    const familyIds = family ? family.map(f => f.id) : [];
    const allMemberIds = [userId, ...familyIds];

    const { data, error } = await supabase
        .from('activity_enrollments')
        .select(`
            *,
            activities (name, schedule, image)
        `)
        .in('member_id', allMemberIds);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
};
