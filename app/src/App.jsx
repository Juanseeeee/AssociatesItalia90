import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, ImageBackground, Image } from 'react-native';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import supabaseClient from './supabaseClient';
import { validateLuhn, validateExpiryDate, validateCVV, validateCardName, capitalizeName, formatExpiryDate, formatCardNumber, getCardType } from './utils/validation';
import AdminRoutes from './Admin';

const API = 'http://localhost:3001/api';

function PageHeader(){
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const items = [
    { path: '/', label: 'Inicio' },
    { path: '/noticias', label: 'Noticias' },
    { 
      path: '/actividades', 
      label: 'Deportes',
      subItems: [
        { label: 'Fútbol 5', path: '/actividades' },
        { label: 'Escuelita de fútbol', path: '/actividades' },
        { label: 'Fútbol Femenino', path: '/actividades' }
      ]
    },
    { 
      path: '/socios', 
      label: 'Socios',
      subItems: [
        { label: 'Beneficios de socio', path: '/socios' },
        { label: 'Actividades', path: '/actividades' },
        { label: 'Asociarme', path: '/asociate' }
      ]
    },
    { 
      path: '/institucional', 
      label: 'Club',
      subItems: [
        { label: 'Quienes Somos?', path: '/institucional' },
        { label: 'Institucion', path: '/institucional' },
        { label: 'Contacto', path: '/institucional' }
      ]
    },
  ];

  return(
    <View style={[styles.headerBar, scrolled && styles.headerBarScrolled]}>
      <View style={styles.headerInner}>
        <TouchableOpacity onPress={()=>navigate('/')} style={styles.brandContainer}>
          <Image source={{uri:'/logo-italia90.png'}} style={styles.brandLogo}/>
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitleLg}>ITALIA 90</Text>
            <Text style={styles.brandSubtitle}>CLUB SOCIAL DEPORTIVO</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <View style={styles.headerNav}>
            {items.map(i=>(
              <View key={i.path} style={{position: 'relative', zIndex: 100}} 
                onMouseEnter={()=>setHoveredItem(i.path)} 
                onMouseLeave={()=>setHoveredItem(null)}
              >
                <TouchableOpacity onPress={()=>navigate(i.path)} style={[styles.headerLink, location.pathname===i.path && styles.headerLinkActive]}>
                  <Text style={styles.headerLinkText}>{i.label}</Text>
                </TouchableOpacity>
                {i.subItems && hoveredItem===i.path && (
                  <View style={styles.dropdown}>
                    {i.subItems.map(sub=>(
                      <TouchableOpacity key={sub.label} style={styles.dropdownItem} onPress={()=>{
                        setHoveredItem(null);
                        navigate(sub.path);
                      }}>
                        <Text style={styles.dropdownItemText}>{sub.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.btnHeader} onPress={()=>navigate('/asociate')}>
            <Text style={styles.btnHeaderText}>ASOCIATE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>navigate('/perfil')} style={styles.profileIcon}>
            <Text style={styles.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

function MatchBanner({ fixtures }) {
  if (!fixtures || fixtures.length === 0) return null;
  const nextMatch = fixtures[0];
  return (
    <View style={styles.matchBanner}>
      <View style={styles.matchBannerInner}>
        <View style={styles.matchInfo}>
          <Text style={styles.matchLabel}>PRÓXIMO PARTIDO</Text>
          <Text style={styles.matchDate}>{new Date(nextMatch.date).toLocaleDateString('es-AR', {weekday:'long', day:'numeric', month:'long'})} • {new Date(nextMatch.date).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}hs</Text>
        </View>
        <View style={styles.matchTeams}>
          <Text style={styles.teamName}>Italia 90</Text>
          <Text style={styles.vs}>VS</Text>
          <Text style={styles.teamName}>{nextMatch.opponent}</Text>
        </View>
        <View style={styles.matchAction}>
          <TouchableOpacity style={styles.btnOutlineLight}>
            <Text style={styles.btnTextLight}>ENTRADAS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SiteNav({ onAnchor }){
  const navigate = useNavigate();
  const items=['Fútbol','Institucional','Socios','Polideportivo','Entradas','Multimedia','Italia90 ID'];
  return(
    <View style={styles.siteNav}>
      <View style={styles.siteNavInner}>
        {items.map(x=><TouchableOpacity
          key={x}
          style={styles.siteNavItem}
          onPress={()=>{
            if(onAnchor && (x==='Fútbol' || x==='Multimedia' || x==='Socios')){
              // mapa: Fútbol->noticias (top), Multimedia->noticias, Socios->servicios/planes
              const key = x==='Socios' ? 'servicios' : 'noticias';
              onAnchor(key);
            }else{
              navigate(x==='Socios'?'/socios':x==='Institucional'?'/institucional':x==='Fútbol'?'/':x==='Multimedia'?'/noticias':'/servicios')
            }
          }}>
            <Text style={styles.siteNavText}>{x}</Text>
          </TouchableOpacity>)}
      </View>
    </View>
  )
}

function Nav({ route, setRoute }) {
  const navigate = useNavigate();
  const items = [
    { key: 'home', label: 'Inicio' },
    { key: 'asociate', label: 'Asociate' },
    { key: 'actividades', label: 'Actividades' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'perfil', label: 'Perfil' },
    { key: 'servicios', label: 'Servicios' },
    { key: 'admin', label: 'Admin' },
  ];
  return (
    <View style={styles.topnav}>
      {items.map(i => (
        <TouchableOpacity key={i.key} onPress={() => navigate(i.key==='home'?'/':`/${i.key}`)} style={[styles.navItem, route===i.key && styles.navItemActive]}>
          <Text style={styles.navText}>{i.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Hero({ title, subtitle, cta1, cta2, image, images, interval=7000 }) {
  const imgs = useMemo(()=> (images && images.length ? images : (image ? [image] : ['/assets/hero-cancha-pan.jpg'])), [images, image]);
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    if(imgs.length<=1) return;
    const t=setInterval(()=>setIdx(i=>(i+1)%imgs.length), interval);
    return ()=>clearInterval(t);
  },[imgs.length, interval]);
  const current = imgs[idx] || '/assets/hero-cancha-pan.jpg';
  return (
    <ImageBackground source={{uri: current}} style={styles.heroImg} imageStyle={styles.heroImgInner}>
      <View style={styles.heroOverlay}/>
      <View style={styles.heroContent}>
        <Text style={styles.bannerTitle}>{title}</Text>
        <Text style={[styles.p,{color:'#fff'}]}>{subtitle}</Text>
        <View style={styles.row}>{cta1}{cta2}</View>
      </View>
    </ImageBackground>
  );
}

function Card({ title, children, style }) {
  const [hover,setHover]=useState(false);
  return (
    <View style={[styles.card, style, hover && styles.cardHover]} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <View style={styles.cardFlagBar}>
        <View style={[styles.brandStripe,{backgroundColor:'#049756', flex:1, borderTopLeftRadius:18}]}/>
        <View style={[styles.brandStripe,{backgroundColor:'#ffffff', flex:1}]}/>
        <View style={[styles.brandStripe,{backgroundColor:'#f42b29', flex:1, borderTopRightRadius:18}]}/>
      </View>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function SectionTitle({ children }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBar}/>
      <Text style={styles.sectionHeading}>{children}</Text>
    </View>
  );
}
function Carousel({ images=[], interval=4000 }) {
  const [idx,setIdx]=useState(0);
  const timer=useRef(null);
  useEffect(()=>{
    if(!images.length) return;
    timer.current=setInterval(()=>setIdx(i=>(i+1)%images.length), interval);
    return ()=>{ if(timer.current) clearInterval(timer.current) };
  },[images.length, interval]);
  if(!images.length) return null;
  const prev=()=>setIdx(i=>(i-1+images.length)%images.length);
  const next=()=>setIdx(i=>(i+1)%images.length);
  return (
    <View style={styles.carousel}>
      <Image source={{uri:images[idx]}} style={styles.carouselImage}/>
      <View style={styles.carouselDots}>
        {images.map((_,i)=>(<View key={i} style={[styles.dot, i===idx && styles.dotActive]}/>))}
      </View>
      <TouchableOpacity onPress={prev} style={[styles.carouselBtn, styles.carouselBtnLeft]}><Text style={styles.carouselBtnText}>‹</Text></TouchableOpacity>
      <TouchableOpacity onPress={next} style={[styles.carouselBtn, styles.carouselBtnRight]}><Text style={styles.carouselBtnText}>›</Text></TouchableOpacity>
    </View>
  );
}

function Footer(){
  return(
    <View style={styles.footerContainer}>
      <View style={styles.sponsorsBar}>
         <View style={styles.wrapper}>
            <Text style={styles.sponsorsTitle}>NOS ACOMPAÑAN</Text>
            <View style={styles.sponsorsRow}>
               <View style={styles.sponsorItem}><Text style={styles.sponsorText}>SPONSOR</Text></View>
               <View style={styles.sponsorItem}><Text style={styles.sponsorText}>SPONSOR</Text></View>
               <View style={styles.sponsorItem}><Text style={styles.sponsorText}>SPONSOR</Text></View>
               <View style={styles.sponsorItem}><Text style={styles.sponsorText}>SPONSOR</Text></View>
            </View>
         </View>
      </View>
      <View style={styles.footerMain}>
        <View style={styles.wrapper}>
           <View style={styles.footerColumns}>
              <View style={styles.footerCol}>
                 <Text style={styles.footerColTitle}>ITALIA 90</Text>
                 <Text style={styles.footerLink}>Historia</Text>
                 <Text style={styles.footerLink}>Autoridades</Text>
                 <Text style={styles.footerLink}>Estatuto</Text>
                 <Text style={styles.footerLink}>Transparencia</Text>
              </View>
              <View style={styles.footerCol}>
                 <Text style={styles.footerColTitle}>DEPORTES</Text>
                 <Text style={styles.footerLink}>Fútbol</Text>
                 <Text style={styles.footerLink}>Básquet</Text>
                 <Text style={styles.footerLink}>Vóley</Text>
                 <Text style={styles.footerLink}>Patín</Text>
              </View>
              <View style={styles.footerCol}>
                 <Text style={styles.footerColTitle}>SOCIOS</Text>
                 <Text style={styles.footerLink}>Asociate</Text>
                 <Text style={styles.footerLink}>Atención al Socio</Text>
                 <Text style={styles.footerLink}>Reglamento</Text>
                 <Text style={styles.footerLink}>Preguntas Frecuentes</Text>
              </View>
              <View style={styles.footerCol}>
                 <Text style={styles.footerColTitle}>CONTACTO</Text>
                 <Text style={styles.footerText}>Av. Principal 123</Text>
                 <Text style={styles.footerText}>Ciudad, Buenos Aires</Text>
                 <Text style={styles.footerText}>+54 11 1234-5678</Text>
                 <Text style={styles.footerText}>info@italia90.com.ar</Text>
                 <View style={styles.socialRow}>
                    <TouchableOpacity onPress={()=>window.open('https://instagram.com','_blank')}>
                       <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png'}} style={styles.socialIconImg} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>window.open('https://facebook.com','_blank')}>
                       <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Facebook_f_logo_%282019%29.svg/100px-Facebook_f_logo_%282019%29.svg.png'}} style={styles.socialIconImg} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>window.open('https://twitter.com','_blank')}>
                       <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/100px-X_logo_2023.svg.png'}} style={styles.socialIconImg} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>window.open('https://youtube.com','_blank')}>
                       <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/128px-YouTube_full-color_icon_%282017%29.svg.png'}} style={styles.socialIconImg} />
                    </TouchableOpacity>
                 </View>
              </View>
           </View>
           <View style={styles.footerBottom}>
              <Text style={styles.copyright}>© {new Date().getFullYear()} Club Social y Deportivo Italia 90. Todos los derechos reservados.</Text>
           </View>
        </View>
      </View>
    </View>
  )
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation(); // Añadido para verificar ruta
  const [route, setRoute] = useState('home');
  const [session, setSession] = useState(null);
  const [kpis, setKpis] = useState({memberships:0, payments:0, activities:0});
  const [activities, setActivities] = useState([]);
  const [payments, setPayments] = useState([]);
  const [news, setNews] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [services, setServices] = useState([]);
  const anchorRefs = {
    noticias: useRef(null),
    servicios: useRef(null),
    planes: useRef(null),
    partidos: useRef(null)
  };
  const scrollToAnchor = (key) => {
    try{
      anchorRefs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }catch(e){}
  };

  useEffect(() => {
    fetch(`${API}/kpi`).then(r=>r.json()).then(setKpis).catch(()=>{});
    fetch(`${API}/activities`).then(r=>r.json()).then(setActivities).catch(()=>{});
    fetch(`${API}/payments`).then(r=>r.json()).then(setPayments).catch(()=>{});
    fetch(`${API}/fixtures`).then(r=>r.json()).then(setFixtures).catch(()=>{});
    fetch(`${API}/services`).then(r=>r.json()).then(setServices).catch(()=>{});
  }, []);

  // Refrescar noticias al navegar a inicio o noticias para reflejar cambios del admin
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/noticias' || location.pathname === '/institucional') {
       fetch(`${API}/news`).then(r=>r.json()).then(setNews).catch(()=>{});
    }
  }, [location.pathname]);

  const HomeContent = () => (
    <>
          <View style={styles.brandBar}>
            <View style={[styles.brandStripe,{backgroundColor:'#049756'}]} />
            <View style={[styles.brandStripe,{backgroundColor:'#ffffff'}]} />
            <View style={[styles.brandStripe,{backgroundColor:'#f42b29'}]} />
          </View>
          <View style={styles.topWhite}>
            <Hero
              title="Campaña de Socios"
              subtitle="Sumate al Italia 90 con una experiencia moderna en web y mobile."
              cta1={<TouchableOpacity style={styles.btn} onPress={() => navigate('/asociate')}><Text style={styles.btnTextPrimary}>Quiero Asociarme</Text></TouchableOpacity>}
              cta2={<TouchableOpacity style={styles.btnGhost} onPress={() => navigate('/actividades')}><Text style={styles.btnTextGhost}>Ver Actividades</Text></TouchableOpacity>}
              images={['/assets/hero-campania.jpg','/assets/hero-campania2.jpeg','/assets/fondo-celebracion.jpg']}
              interval={7000}
            />
            <MatchBanner fixtures={fixtures} />
          </View>
          
          <View style={styles.sectionContainer}>
            <View style={styles.wrapper}>
              <View style={styles.sectionHeaderRow}>
                <Text ref={anchorRefs.noticias} style={styles.sectionTitleLarge}>ÚLTIMAS NOTICIAS</Text>
                <TouchableOpacity onPress={()=>navigate('/noticias')}><Text style={styles.linkText}>VER TODAS</Text></TouchableOpacity>
              </View>
              <View style={styles.newsGridModern}>
                <View style={styles.newsFeaturedCol}>
                  {(news||[])[0] && (
                    <TouchableOpacity key={(news||[])[0].id} style={styles.newsFeatured} onPress={()=>navigate('/noticias')}>
                      <ImageBackground source={{uri: '/assets/escuela-futbol-1.jpg'}} style={styles.newsFeaturedBg} imageStyle={{borderRadius: 8}}>
                        <View style={styles.newsOverlay}>
                          <View style={styles.newsTag}><Text style={styles.newsTagText}>INSTITUCIONAL</Text></View>
                          <Text style={styles.newsFeaturedTitle}>{(news||[])[0].title}</Text>
                          <Text style={styles.newsFeaturedExcerpt} numberOfLines={2}>{(news||[])[0].excerpt}</Text>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.newsSecondaryGrid}>
                  {(news||[]).slice(1,5).map(n => (
                    <TouchableOpacity key={n.id} style={styles.newsSecondaryCard} onPress={()=>navigate('/noticias')}>
                      <Image source={{uri: '/assets/cancha-interna-1.jpg'}} style={styles.newsSecondaryImg} />
                      <View style={styles.newsSecondaryContent}>
                        <Text style={styles.newsDate}>{new Date().toLocaleDateString('es-AR')}</Text>
                        <Text style={styles.newsSecondaryTitle} numberOfLines={3}>{n.title}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <ImageBackground source={{uri:'/assets/hero-campania.jpg'}} style={styles.membershipBanner}>
            <View style={styles.membershipOverlay}>
              <View style={styles.wrapper}>
                <Text style={styles.membershipTitle}>SE PARTE DE LA HISTORIA</Text>
                <Text style={styles.membershipSubtitle}>Asociate hoy y disfrutá de todos los beneficios del club.</Text>
                <View style={styles.rowCenter}>
                  <TouchableOpacity style={styles.btnLg} onPress={()=>navigate('/asociate')}>
                    <Text style={styles.btnTextLg}>QUIERO SER SOCIO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.sectionContainer}>
            <View style={styles.wrapper}>
              <View style={styles.sectionHeaderRow}>
                <Text ref={anchorRefs.servicios} style={styles.sectionTitleLarge}>ACTIVIDADES Y DEPORTES</Text>
                <TouchableOpacity onPress={()=>navigate('/actividades')}><Text style={styles.linkText}>VER TODO</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{gap: 16, paddingBottom: 20}}>
                <TouchableOpacity style={styles.activityCard} onPress={()=>navigate('/actividades')}>
                   <Image source={{uri: '/assets/escuelita-5.jpg'}} style={styles.activityImg}/>
                   <View style={styles.activityOverlay}>
                      <Text style={styles.activityTitle}>Escuela de Fútbol</Text>
                   </View>
                </TouchableOpacity>
                {(activities||[]).map(a => (
                  <TouchableOpacity key={a.id} style={styles.activityCard} onPress={()=>navigate('/actividades')}>
                    <Image source={{uri: '/assets/escuela-futbol-1.jpg'}} style={styles.activityImg}/>
                    <View style={styles.activityOverlay}>
                      <Text style={styles.activityTitle}>{a.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
    </>
  );

  const AsociateContent = () => (
    <>
          <ImageBackground source={{uri: '/assets/hero-cancha-ras.jpg'}} style={styles.pageHero}>
            <View style={styles.pageHeroOverlay}>
              <View style={styles.wrapper}>
                <Text style={styles.pageHeroTitle}>ASOCIATE ONLINE</Text>
                <Text style={styles.pageHeroSubtitle}>En pocos pasos, formá parte de la familia más grande.</Text>
              </View>
            </View>
          </ImageBackground>
          <View style={styles.sectionContainer}>
            <View style={styles.wrapperNarrow}>
              <View style={styles.authCard}>
                 <Text style={styles.formTitle}>Formulario de Inscripción</Text>
                 <Text style={styles.formSubtitle}>Completá tus datos para finalizar la solicitud.</Text>
                 <AssociateForm onDone={(prefill)=>navigate('/pagos',{ state: { prefill }})} />
              </View>
            </View>
          </View>
    </>
  );

  const ActividadesContent = () => {
    const heroImages = ['/assets/deportes-1.jpg', '/assets/deportes-2.jpg', '/assets/Femenino-12.jpg'];
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setHeroIndex((prev) => (prev + 1) % heroImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }, []);

    return (
      <>
            <ImageBackground source={{uri: heroImages[heroIndex]}} style={styles.pageHero}>
              <View style={styles.pageHeroOverlay}>
                <View style={styles.wrapper}>
                  <Text style={styles.pageHeroTitle}>ACTIVIDADES Y DEPORTES</Text>
                  <Text style={styles.pageHeroSubtitle}>Formamos deportistas y personas. Sumate a nuestras disciplinas.</Text>
                </View>
              </View>
            </ImageBackground>
            
            <View style={styles.sectionContainer}>
              <View style={styles.wrapper}>
                <Text style={styles.sectionTitleLarge}>NUESTRAS ESCUELAS</Text>
                <View style={styles.activitiesGrid}>
                  <View style={styles.activityBigCard}>
                     <Image source={{uri:'/assets/escuelita-3.jpg'}} style={styles.activityBigImg}/>
                     <View style={styles.activityBigContent}>
                        <View style={styles.tag}><Text style={styles.tagText}>FÚTBOL INFANTIL</Text></View>
                        <Text style={styles.activityBigTitle}>Escuelita de Fútbol</Text>
                        <Text style={styles.p}>Para niños y niñas de 4 a 12 años. Iniciación deportiva, valores y compañerismo en un ambiente seguro y divertido.</Text>
                        <View style={styles.row}>
                          <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>Lunes y Miércoles 17hs</Text></View>
                          <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>Cupos Limitados</Text></View>
                        </View>
                        <TouchableOpacity style={styles.btn}><Text style={styles.btnTextPrimary}>QUIERO INSCRIBIRME</Text></TouchableOpacity>
                     </View>
                  </View>

                  {activities.map(a=>(
                    <View key={a.id} style={styles.activityItemCard}>
                      <Image source={{uri: '/assets/escuelita-4.jpg'}} style={styles.activityItemImg}/>
                      <View style={styles.activityItemContent}>
                      <Text style={styles.activityItemTitle}>{a.name}</Text>
                      <View style={styles.row}>
                         <Text style={styles.activityItemInfo}>Cupos: {a.slots}</Text>
                      </View>
                      <TouchableOpacity style={styles.btnOutline}><Text style={styles.btnTextOutline}>Inscribirme</Text></TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
    </>
  );
};

  const ServiciosContent = () => (
    <>
          <ImageBackground source={{uri: '/assets/cancha-interna-1.jpg'}} style={styles.pageHero}>
            <View style={styles.pageHeroOverlay}>
              <View style={styles.wrapper}>
                <Text style={styles.pageHeroTitle}>INSTITUCIONAL</Text>
                <Text style={styles.pageHeroSubtitle}>Más que un club, una familia. Conocé nuestras instalaciones y servicios.</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.sectionContainer}>
            <View style={styles.wrapper}>
              <Text style={styles.sectionTitleLarge}>NUESTROS SERVICIOS</Text>
              <View style={styles.servicesGrid}>
                {(services||[]).map(s=>(
                  <View key={s.id} style={styles.serviceCardWide}>
                    <Image source={{uri: '/assets/cancha-interna-1.jpg'}} style={styles.serviceWideImg}/>
                    <View style={styles.serviceWideContent}>
                      <Text style={styles.serviceWideTitle}>{s.name}</Text>
                      <Text style={styles.p}>{s.description}</Text>
                      <TouchableOpacity style={styles.btnGhostSmall}><Text style={styles.btnTextGhost}>SOLICITAR INFO</Text></TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              
              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>¿Querés organizar un evento?</Text>
                <Text style={styles.calloutText}>Alquilamos nuestros salones y canchas para eventos privados y corporativos.</Text>
                <TouchableOpacity style={styles.btn}><Text style={styles.btnTextPrimary}>CONTACTANOS</Text></TouchableOpacity>
              </View>
            </View>
          </View>
    </>
  );

  const SociosContent = () => (
    <>
          <ImageBackground source={{uri: '/assets/hero-campania2.jpeg'}} style={styles.pageHero}>
            <View style={styles.pageHeroOverlay}>
              <View style={styles.wrapper}>
                <Text style={styles.pageHeroTitle}>HAZTE SOCIO</Text>
                <Text style={styles.pageHeroSubtitle}>Sé parte de la pasión. Elegí el plan que mejor se adapte a vos.</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.sectionContainer}>
            <View style={styles.wrapper}>
              <Text style={styles.sectionTitleLarge}>NUESTROS PLANES</Text>
              <View style={styles.pricingGrid}>
                <View style={styles.pricingCard}>
                  <Text style={styles.pricingTitle}>MENOR</Text>
                  <Text style={styles.pricingPrice}>$8.000<Text style={styles.pricingPeriod}>/mes</Text></Text>
                  <View style={styles.divider}/>
                  <Text style={styles.pricingFeature}>✓ Acceso al club</Text>
                  <Text style={styles.pricingFeature}>✓ Escuela deportiva</Text>
                  <Text style={styles.pricingFeature}>✓ Descuentos en indumentaria</Text>
                  <TouchableOpacity style={styles.btnOutline} onPress={()=>navigate('/asociate')}><Text style={styles.btnTextOutline}>ASOCIARME</Text></TouchableOpacity>
                </View>

                <View style={[styles.pricingCard, styles.pricingCardFeatured]}>
                  <View style={styles.popularTag}><Text style={styles.popularTagText}>MÁS ELEGIDO</Text></View>
                  <Text style={[styles.pricingTitle, styles.textWhite]}>INDIVIDUAL</Text>
                  <Text style={[styles.pricingPrice, styles.textWhite]}>$12.000<Text style={[styles.pricingPeriod, styles.textWhiteOpt]}>/mes</Text></Text>
                  <View style={[styles.divider, {borderColor:'rgba(255,255,255,0.2)'}]}/>
                  <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Acceso total al club</Text>
                  <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Gimnasio incluido</Text>
                  <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Voz y voto en asambleas</Text>
                  <Text style={[styles.pricingFeature, styles.textWhite]}>✓ Sorteos exclusivos</Text>
                  <TouchableOpacity style={styles.btnWhite} onPress={()=>navigate('/asociate')}><Text style={styles.btnTextPrimary}>QUIERO ESTE PLAN</Text></TouchableOpacity>
                </View>

                <View style={styles.pricingCard}>
                  <Text style={styles.pricingTitle}>FAMILIAR</Text>
                  <Text style={styles.pricingPrice}>$24.000<Text style={styles.pricingPeriod}>/mes</Text></Text>
                  <View style={styles.divider}/>
                  <Text style={styles.pricingFeature}>✓ Grupo familiar directo</Text>
                  <Text style={styles.pricingFeature}>✓ Acceso para todos</Text>
                  <Text style={styles.pricingFeature}>✓ Escuelas deportivas bonificadas</Text>
                  <TouchableOpacity style={styles.btnOutline} onPress={()=>navigate('/asociate')}><Text style={styles.btnTextOutline}>ASOCIARME</Text></TouchableOpacity>
                </View>
              </View>

              <View style={styles.benefitsSection}>
                 <Text style={styles.sectionTitleLarge}>BENEFICIOS EXCLUSIVOS</Text>
                 <View style={styles.benefitsGrid}>
                    <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>🏟️</Text>
                       <Text style={styles.benefitTitle}>Prioridad en Entradas</Text>
                       <Text style={styles.benefitDesc}>Acceso anticipado a la compra de tickets para partidos importantes.</Text>
                    </View>
                    <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>👕</Text>
                       <Text style={styles.benefitTitle}>Descuentos en Tienda</Text>
                       <Text style={styles.benefitDesc}>20% off en indumentaria oficial y merchandising del club.</Text>
                    </View>
                    <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>🎉</Text>
                       <Text style={styles.benefitTitle}>Eventos Privados</Text>
                       <Text style={styles.benefitDesc}>Invitaciones a cenas, sorteos y encuentros con jugadores.</Text>
                    </View>
                 </View>
              </View>
            </View>
          </View>
    </>
  );

  const PagosContent = () => (
    <>
          <ImageBackground source={{uri: '/assets/cancha-interna-1.jpg'}} style={styles.pageHero}>
            <View style={styles.pageHeroOverlay}>
              <View style={styles.wrapper}>
                <Text style={styles.pageHeroTitle}>CENTRO DE PAGOS</Text>
                <Text style={styles.pageHeroSubtitle}>Gestioná tus cuotas y aranceles de forma simple y segura.</Text>
              </View>
            </View>
          </ImageBackground>
          
          <View style={styles.sectionContainer}>
            <View style={styles.wrapperNarrow}>
              <View style={styles.authCard}>
                 <PaymentForm onDone={()=>navigate('/')}/>
              </View>
              
              <View style={styles.sectionSpacer}/>
              
              <View style={styles.sectionHeader}>
                 <Text style={styles.sectionHeaderTitle}>HISTORIAL DE PAGOS</Text>
              </View>
              
              <View style={styles.authCard}>
                {payments.length===0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.p}>No hay pagos registrados.</Text>
                  </View>
                ) : (
                  payments.slice(0,10).map(p=>(
                    <View key={p.id} style={styles.tableRow}>
                       <View>
                          <Text style={styles.tableCellBold}>{p.concept}</Text>
                          <Text style={styles.tableCell}>{new Date().toLocaleDateString()}</Text>
                       </View>
                       <View style={[styles.statusBadge, p.status==='aprobado'?styles.statusSuccess:styles.statusError]}>
                          <Text style={[styles.statusText, p.status==='aprobado'?styles.statusSuccessText:styles.statusErrorText]}>{p.status}</Text>
                       </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
    </>
  );

  const PerfilContent = () => (
    <>
          <View style={styles.profileHeader}>
             <View style={styles.wrapper}>
                <Text style={styles.profileTitle}>MI CUENTA</Text>
             </View>
          </View>
          <View style={styles.sectionContainer}>
            <View style={styles.wrapper}>
              {session? <Profile session={session}/> : <Auth setSession={setSession} />}
            </View>
          </View>
    </>
  );

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <ScrollView style={styles.page}>
      {!isAdminRoute && <PageHeader/>}
      <Routes>
        <Route path="/" element={<HomeContent/>}/>
        <Route path="/asociate" element={<AsociateContent/>}/>
        <Route path="/actividades" element={<ActividadesContent/>}/>
        <Route path="/servicios" element={<ServiciosContent/>}/>
        <Route path="/socios" element={<SociosContent/>}/>
        <Route path="/pagos" element={<PagosContent/>}/>
        <Route path="/payment/success" element={<PaymentSuccess/>}/>
        <Route path="/payment/failure" element={<PaymentFailure/>}/>
        <Route path="/payment/pending" element={<PaymentPending/>}/>
        <Route path="/perfil" element={<PerfilContent/>}/>
        <Route path="/institucional" element={<HomeContent/>}/>
        <Route path="/noticias" element={<HomeContent/>}/>
        <Route path="/admin/*" element={<AdminRoutes/>}/>
      </Routes>
      {!isAdminRoute && <Footer/>}
    </ScrollView>
  );
}


function Profile({ session }){
  const [ms,setMs]=useState([]);
  const [ps,setPs]=useState([]);
  useEffect(()=>{
    if(session?.email){
      fetch(`${API}/memberships/by-email?email=${encodeURIComponent(session.email)}`).then(r=>r.json()).then(setMs).catch(()=>{});
      fetch(`${API}/payments/by-email?email=${encodeURIComponent(session.email)}`).then(r=>r.json()).then(setPs).catch(()=>{});
    }
  },[session]);
  const m = ms[0];
  const hasDebt = ps.some(x=>x.status==='rechazado');

  return (
    <View>
      <Text style={[styles.h1, {marginBottom: 24}]}>Hola, {session.name.split(' ')[0]}</Text>
      
      {m ? (
        <>
          <View style={styles.dashboardGrid}>
             <View style={styles.dashboardCard}>
                <Text style={styles.statNumber}>{m.memberType==='activo'?'ACTIVO':'INACTIVO'}</Text>
                <Text style={styles.statLabel}>ESTADO DE SOCIO</Text>
             </View>
             <View style={styles.dashboardCard}>
                <Text style={[styles.statNumber, {color: hasDebt?'#dc2626':'#049756'}]}>{hasDebt?'PENDIENTE':'AL DÍA'}</Text>
                <Text style={styles.statLabel}>CUOTA SOCIAL</Text>
             </View>
             <View style={styles.dashboardCard}>
                <Text style={styles.statNumber}>{m.rights?.political?'SÍ':'NO'}</Text>
                <Text style={styles.statLabel}>VOTO HABILITADO</Text>
             </View>
          </View>

          <View style={styles.authCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>MIS DATOS</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Tipo de Socio</Text>
              <Text style={styles.tableCellBold}>{m.memberType.toUpperCase()}</Text>
            </View>
            <View style={styles.tableRow}>
               <Text style={styles.tableCell}>N° de Socio</Text>
               <Text style={styles.tableCellBold}>{m.id || '-'}</Text>
            </View>
             <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Email</Text>
                <Text style={styles.tableCellBold}>{session.email}</Text>
             </View>
          </View>
        </>
      ) : (
        <View style={styles.calloutBox}>
           <Text style={styles.calloutTitle}>No sos socio aún</Text>
           <Text style={styles.calloutText}>Asociate hoy mismo para disfrutar de todos los beneficios.</Text>
           <TouchableOpacity style={styles.btn}><Text style={styles.btnTextPrimary}>ASOCIARME AHORA</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionSpacer}/>
      <View style={styles.authCard}>
         <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>ÚLTIMOS MOVIMIENTOS</Text>
         </View>
         {ps.length===0 ? <Text style={styles.p}>No hay movimientos registrados.</Text> : 
           ps.slice(0,5).map(p=>(
             <View key={p.id} style={styles.tableRow}>
                <View>
                   <Text style={styles.tableCellBold}>{p.concept}</Text>
                   <Text style={styles.tableCell}>{new Date().toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, p.status==='aprobado'?styles.statusSuccess:styles.statusError]}>
                   <Text style={[styles.statusText, p.status==='aprobado'?styles.statusSuccessText:styles.statusErrorText]}>{p.status}</Text>
                </View>
             </View>
           ))
         }
      </View>
    </View>
  )
}

function Auth({ setSession }) {
  const [email,setEmail]=useState('');
  const [pass,setPass]=useState('');
  const [name,setName]=useState('');
  const [isRegister,setIsRegister]=useState(false);

  return (
    <View style={styles.authContainer}>
      <View style={styles.authCard}>
        <Text style={styles.formTitle}>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</Text>
        <Text style={styles.formSubtitle}>{isRegister ? 'Completá tus datos para registrarte.' : 'Ingresá a tu cuenta de socio.'}</Text>
        
        {isRegister && (
          <View>
             <Text style={styles.inputLabel}>Nombre Completo</Text>
             <TextInput style={styles.inputModern} placeholder="Tu nombre" value={name} onChangeText={setName}/>
          </View>
        )}
        
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput style={styles.inputModern} placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
        
        <Text style={styles.inputLabel}>Contraseña</Text>
        <TextInput style={styles.inputModern} placeholder="••••••••" value={pass} onChangeText={setPass} secureTextEntry/>

        <TouchableOpacity style={[styles.btnLg, styles.authBtn]} onPress={async ()=>{
          const endpoint = isRegister ? '/auth/register' : '/auth/login';
          const body = isRegister ? {email,pass,name} : {email,pass};
          const r=await fetch(`${API}${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
          if(r.ok){
             if(isRegister) {
                setSession({email,name});
             } else {
                const d=await r.json();
                setSession({email,name:d.name});
             }
          } else {
             alert('Error en la autenticación');
          }
        }}>
           <Text style={styles.btnTextLg}>{isRegister ? 'REGISTRARME' : 'INGRESAR'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={()=>setIsRegister(!isRegister)}>
           <Text style={styles.authLink}>
              {isRegister ? '¿Ya tenés cuenta? Iniciar Sesión' : '¿No tenés cuenta? Registrate'}
           </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AssociateForm({ onDone }) {
  const [plan,setPlan]=useState('individual');
  const [name,setName]=useState('');
  const [dni,setDni]=useState('');
  const [email,setEmail]=useState('');
  const [phone,setPhone]=useState('');
  const [errors,setErrors]=useState({});
  
  const plans = [
    {id: 'menor', label: 'MENOR', price: 8000},
    {id: 'individual', label: 'INDIVIDUAL', price: 12000},
    {id: 'familiar', label: 'FAMILIAR', price: 24000}
  ];
  
  const currentPlan = plans.find(p=>p.id===plan);

  const validate = () => {
     const newErrors = {};
     if(!name.trim()) newErrors.name = true;
     if(!dni.trim() || dni.length < 7) newErrors.dni = true;
     if(!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = true;
     if(!phone.trim()) newErrors.phone = true;
     setErrors(newErrors);
     return Object.keys(newErrors).length === 0;
  };

  return (
    <View>
      <Text style={styles.inputLabel}>Seleccioná tu Plan</Text>
      <View style={styles.planSelector}>
        {plans.map(p=>(
          <TouchableOpacity key={p.id} style={[styles.pillModern, plan===p.id && styles.pillModernActive]} onPress={()=>setPlan(p.id)}>
            <Text style={[styles.pillTextModern, plan===p.id && styles.pillTextModernActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>Nombre Completo</Text>
      <TextInput style={[styles.inputModern, errors.name && styles.inputError]} placeholder="Nombre y Apellido" value={name} onChangeText={setName}/>
      
      <Text style={styles.inputLabel}>DNI</Text>
      <TextInput style={[styles.inputModern, errors.dni && styles.inputError]} placeholder="Sin puntos ni espacios" value={dni} onChangeText={t=>setDni(t.replace(/[^\d]/g,''))} keyboardType="numeric"/>
      
      <Text style={styles.inputLabel}>Email</Text>
      <TextInput style={[styles.inputModern, errors.email && styles.inputError]} placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
      
      <Text style={styles.inputLabel}>Teléfono</Text>
      <TextInput style={[styles.inputModern, errors.phone && styles.inputError]} placeholder="Cod. área + número" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
      
      <View style={styles.totalBox}>
         <Text style={styles.totalLabel}>Total a pagar</Text>
         <Text style={styles.totalAmount}>${currentPlan.price}</Text>
      </View>

      <TouchableOpacity style={styles.btnLg} onPress={()=>{
        if(!validate()) return;
        // En lugar de enviar, pasamos los datos al siguiente paso (pago)
        onDone && onDone({ 
          name, 
          dni, 
          email, 
          phone, 
          plan, 
          price: currentPlan.price,
          concept: `Cuota Social Plan ${currentPlan.label}`, 
          amount: String(currentPlan.price)
        });
      }}>
         <Text style={styles.btnTextLg}>CONTINUAR AL PAGO</Text>
      </TouchableOpacity>
    </View>
  );
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  return (
   <View style={styles.sectionContainer}>
     <View style={styles.wrapperNarrow}>
       <View style={[styles.authCard, {alignItems:'center'}]}>
         <Text style={{fontSize:48, marginBottom:16}}>✅</Text>
         <Text style={styles.formTitle}>¡Pago Exitoso!</Text>
         <Text style={styles.p}>Tu pago se procesó correctamente. Bienvenido a Italia 90.</Text>
         <TouchableOpacity style={[styles.btnLg, {marginTop:24}]} onPress={()=>navigate('/')}>
           <Text style={styles.btnTextLg}>VOLVER AL INICIO</Text>
         </TouchableOpacity>
       </View>
     </View>
   </View>
  );
};

const PaymentFailure = () => {
  const navigate = useNavigate();
  return (
   <View style={styles.sectionContainer}>
     <View style={styles.wrapperNarrow}>
       <View style={[styles.authCard, {alignItems:'center'}]}>
         <Text style={{fontSize:48, marginBottom:16}}>❌</Text>
         <Text style={styles.formTitle}>Pago Rechazado</Text>
         <Text style={styles.p}>Hubo un problema con tu pago. Por favor intentá nuevamente.</Text>
         <TouchableOpacity style={[styles.btnLg, {marginTop:24}]} onPress={()=>navigate('/pagos')}>
           <Text style={styles.btnTextLg}>INTENTAR NUEVAMENTE</Text>
         </TouchableOpacity>
       </View>
     </View>
   </View>
  );
};

const PaymentPending = () => {
  const navigate = useNavigate();
  return (
   <View style={styles.sectionContainer}>
     <View style={styles.wrapperNarrow}>
       <View style={[styles.authCard, {alignItems:'center'}]}>
         <Text style={{fontSize:48, marginBottom:16}}>⏳</Text>
         <Text style={styles.formTitle}>Pago Pendiente</Text>
         <Text style={styles.p}>Tu pago se está procesando. Te avisaremos cuando se confirme.</Text>
         <TouchableOpacity style={[styles.btnLg, {marginTop:24}]} onPress={()=>navigate('/')}>
           <Text style={styles.btnTextLg}>VOLVER AL INICIO</Text>
         </TouchableOpacity>
       </View>
     </View>
   </View>
  );
};

function PaymentForm({ onDone }) {
  const location = useLocation();
  const [memberData, setMemberData] = useState(null);
  const [concept,setConcept]=useState('cuota');
  const [amount,setAmount]=useState('');
  const [email,setEmail]=useState('');
  const [paymentMethod, setPaymentMethod] = useState('mp'); // 'mp' | 'card'

  // Form State
  const [card, setCard] = useState('');
  const [name, setName] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardType, setCardType] = useState('');
  
  // Validation State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [showCvvHelp, setShowCvvHelp] = useState(false);
  
  useEffect(()=>{
    const data = location?.state?.prefill; 
    if(data){
      setMemberData(data);
      if(data.concept) setConcept(data.concept);
      if(data.amount) setAmount(data.amount);
      if(data.email) setEmail(data.email);
    }
  },[]);

  // Validation Logic
  useEffect(() => {
    if (paymentMethod === 'mp') {
      setIsValid(true);
      return;
    }
    const hasErrors = Object.keys(errors).length > 0;
    const allFilled = card && name && exp && cvv;
    setIsValid(allFilled && !hasErrors);
  }, [errors, card, name, exp, cvv, paymentMethod]);

  const validateField = (field, value) => {
    let error = '';
    switch(field) {
      case 'card':
        const rawCard = value.replace(/\s/g, '');
        if (!value) error = 'El número de tarjeta es obligatorio';
        else if (rawCard.length < 13) error = 'El número está incompleto';
        else if (!validateLuhn(value)) error = 'El número de tarjeta no es válido';
        break;
      case 'name':
        if (!value) error = 'El nombre es obligatorio';
        else if (!validateCardName(value)) error = 'Ingrese nombre completo (solo letras)';
        break;
      case 'exp':
        if (!value) error = 'Requerido';
        else if (!validateExpiryDate(value)) error = 'Fecha inválida (MM/YY)';
        break;
      case 'cvv':
        if (!value) error = 'Requerido';
        else if (!validateCVV(value)) error = '3 dígitos';
        break;
    }
    return error;
  };

  const handleChange = (field, value) => {
    let formatted = value;

    if (field === 'card') {
      formatted = formatCardNumber(value);
      const type = getCardType(formatted);
      setCardType(type);
      setCard(formatted);
    } else if (field === 'name') {
      formatted = capitalizeName(value);
      setName(formatted);
    } else if (field === 'exp') {
      formatted = formatExpiryDate(value);
      setExp(formatted);
    } else if (field === 'cvv') {
      formatted = value.replace(/\D/g, '').slice(0, 4);
      setCvv(formatted);
    }

    // Real-time validation
    const error = validateField(field, formatted);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === 'card' ? card : field === 'name' ? name : field === 'exp' ? exp : cvv;
    const error = validateField(field, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });
  };

  const renderInput = (field, label, value, placeholder, props = {}) => {
    const hasError = touched[field] && errors[field];
    const isSuccess = touched[field] && !errors[field] && value;
    
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={{position: 'relative'}}>
            <TextInput
            style={[
                styles.inputModern,
                styles.inputModernNoMargin,
                hasError && styles.inputErrorState,
                isSuccess && styles.inputSuccessState,
                props.style
            ]}
            value={value}
            placeholder={placeholder}
            onChangeText={(text) => handleChange(field, text)}
            onBlur={() => handleBlur(field)}
            {...props}
            />
            {/* Success/Error Icons */}
            {(hasError || isSuccess) && (
            <View style={styles.iconRight}>
                <Text>{hasError ? '⚠️' : '✅'}</Text>
            </View>
            )}
            {/* Card Type Badge */}
            {field === 'card' && cardType && !hasError && (
            <View style={styles.cardTypeBadge}>
                <Text style={styles.cardTypeText}>{cardType}</Text>
            </View>
            )}
        </View>
        {hasError && (
          <Text style={styles.validationMessage}>{errors[field]}</Text>
        )}
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.formTitle}>Realizar Pago y Finalizar</Text>
      <Text style={styles.formSubtitle}>Elegí tu método de pago para confirmar la asociación.</Text>
      
      <Text style={styles.inputLabel}>Método de Pago</Text>
      <View style={{flexDirection:'row', gap:10, marginBottom:20}}>
        <TouchableOpacity style={[styles.pillModern, paymentMethod==='mp' && styles.pillModernActive]} onPress={()=>setPaymentMethod('mp')}>
          <Text style={[styles.pillTextModern, paymentMethod==='mp' && styles.pillTextModernActive]}>Mercado Pago</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pillModern, paymentMethod==='card' && styles.pillModernActive]} onPress={()=>setPaymentMethod('card')}>
          <Text style={[styles.pillTextModern, paymentMethod==='card' && styles.pillTextModernActive]}>Tarjeta (Mock)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Email del socio</Text>
      <TextInput style={[styles.inputModern, styles.inputReadonly]} editable={false} placeholder="Email del socio" value={email} onChangeText={setEmail}/>
      
      <Text style={styles.inputLabel}>Concepto</Text>
      <TextInput style={[styles.inputModern, styles.inputReadonly]} editable={false} placeholder="Concepto" value={concept}/>
      
      <Text style={styles.inputLabel}>Monto a Pagar</Text>
      <View style={styles.inputCurrencyWrapper}>
        <View style={styles.currencySymbol}><Text style={styles.currencyText}>$</Text></View>
        <TextInput style={styles.inputCurrency} editable={false} placeholder="Monto" value={amount}/>
      </View>

      {paymentMethod === 'card' && (
        <>
          {renderInput('card', 'Número de Tarjeta', card, '4111 1111 1111 1111', { keyboardType: 'numeric', maxLength: 19 })}
          {renderInput('name', 'Nombre en Tarjeta', name, 'Como figura en el plástico')}
          
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
               {renderInput('exp', 'Vencimiento', exp, 'MM/YY', { keyboardType: 'numeric', maxLength: 5 })}
            </View>
            <View style={styles.formColumn}>
              <View style={styles.inputGroup}>
                <View style={[styles.labelRow, styles.mb8]}>
                    <Text style={[styles.inputLabel, styles.mb0]}>CVV</Text>
                    <TouchableOpacity onPress={()=>setShowCvvHelp(s=>!s)}>
                    <Text style={styles.cvvHelpButton}>¿Qué es?</Text>
                    </TouchableOpacity>
                </View>
                <View style={{position: 'relative'}}>
                    <TextInput 
                        style={[
                            styles.inputModern, 
                            styles.inputModernNoMargin,
                            touched.cvv && errors.cvv && styles.inputErrorState,
                            touched.cvv && !errors.cvv && cvv && styles.inputSuccessState
                        ]}
                        placeholder="123" 
                        value={cvv} 
                        onChangeText={(text)=>handleChange('cvv', text)}
                        onBlur={()=>handleBlur('cvv')}
                        keyboardType="numeric" 
                        secureTextEntry
                        maxLength={4}
                    />
                        {(touched.cvv && (errors.cvv || cvv)) && (
                        <View style={styles.iconRight}>
                            <Text>{errors.cvv ? '⚠️' : '✅'}</Text>
                        </View>
                    )}
                </View>
                {touched.cvv && errors.cvv && <Text style={styles.validationMessage}>{errors.cvv}</Text>}
              </View>
            </View>
          </View>
          
          {showCvvHelp && <Text style={styles.cvvHelpText}>Código de 3 o 4 dígitos al dorso de la tarjeta.</Text>}
        </>
      )}

      {paymentMethod === 'mp' && (
        <View style={{marginBottom: 20, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8, borderWidth: 1, borderColor: '#bae6fd'}}>
           <Text style={{color: '#0369a1', fontWeight: '600', marginBottom: 4}}>Vas a ser redirigido a Mercado Pago</Text>
           <Text style={{color: '#0c4a6e', fontSize: 13}}>Podrás pagar con dinero en cuenta, tarjetas o efectivo.</Text>
        </View>
      )}

      <TouchableOpacity 
        disabled={!isValid}
        style={[
            styles.btnLg, 
            paymentMethod==='mp' && {backgroundColor:'#009ee3'},
            !isValid && styles.btnDisabledState
        ]} 
        onPress={async ()=>{
        if (paymentMethod === 'card' && !isValid) return alert('Complete todos los datos de pago correctamente');

        let url = `${API}/payments/charge`;
        let body = { concept, amount, card, name, exp, cvv, email };

        if (memberData) {
           url = `${API}/members`;
           body = {
             ...memberData,
             payment_method: paymentMethod === 'mp' ? 'mercadopago' : 'credit_card',
             card_last4: paymentMethod === 'mp' ? null : card.slice(-4),
             amount
           };
        } else if (paymentMethod === 'mp') {
           url = `${API}/payments/create_preference`;
           body = {
             title: concept,
             quantity: 1,
             unit_price: amount,
             email: email,
             member_id: 'guest'
           };
        }

        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(body)
          });
          
          const resData = await r.json();

          if(r.ok){
            if (resData.init_point) {
               window.location.href = resData.init_point;
            } else {
               alert('¡Pago exitoso! Bienvenido al club.');
               onDone();
            }
          } else {
            alert('Error: ' + (resData.error || 'No se pudo procesar el pago'));
          }
        } catch(e) {
          alert('Error de conexión');
        }
      }}>
         <Text style={styles.btnTextLg}>
           {paymentMethod==='mp' ? 'PAGAR CON MERCADO PAGO' : (memberData ? 'CONFIRMAR ASOCIACIÓN' : 'PAGAR AHORA')}
         </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor:'transparent', minHeight:'100%' },
  headerBar: { paddingHorizontal:24, paddingVertical:0, backgroundColor:'transparent', borderBottomWidth:0, borderColor:'transparent', marginBottom:0, position:'fixed', top:0, left:0, right:0, zIndex:1000, transition: 'all 0.3s ease' },
  headerBarScrolled: { backgroundColor: '#070571', paddingVertical: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  headerInner:{ maxWidth:1400, alignSelf:'center', width:'100%', flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:14, position:'relative', minHeight:80, zIndex:1001 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  headerNav:{ flexDirection:'row', gap:24, alignItems:'center', justifyContent:'center' },
  brandBlock:{ alignItems:'flex-start', marginLeft: 12 },
  headerLink:{ paddingVertical:8, borderBottomWidth: 2, borderColor: 'transparent' },
  headerLinkActive:{ borderBottomWidth:2, borderColor:'#f42b29' },
  headerLinkText:{ color:'#fff', fontWeight:'700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  btnHeader: { backgroundColor: '#f42b29', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 },
  btnHeaderText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  profileIcon: { padding: 8 },
  matchBanner: { backgroundColor: '#111827', borderBottomWidth: 4, borderColor: '#049756' },
  matchBannerInner: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  matchInfo: { flex: 1, minWidth: 200 },
  matchLabel: { color: '#049756', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  matchDate: { color: '#fff', fontSize: 16, textTransform: 'capitalize' },
  matchTeams: { flexDirection: 'row', alignItems: 'center', gap: 20, flex: 2, justifyContent: 'center' },
  teamName: { color: '#fff', fontSize: 24, fontWeight: '800', textTransform: 'uppercase' },
  vs: { color: '#6b7280', fontSize: 16, fontWeight: '700' },
  matchAction: { flex: 1, alignItems: 'flex-end', minWidth: 150 },
  btnOutlineLight: { borderWidth: 2, borderColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 },
  btnTextLight: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  brandBar: { height:4, width:'100%', flexDirection:'row' },
  brandStripe: { flex:1 },
  brandBar: { height:16, width:'100%', flexDirection:'row' },
  brandStripe: { flex:1 },
  brandLogo:{ width:60, height:72, resizeMode:'contain', marginRight:8, marginBottom:-10, zIndex:2 },
  brandTitleLg: { color:'#fff', fontWeight:'800', fontSize:18 },
  brandSubtitle: { color:'#c9c7de', fontSize:12 },
  headerActions: { flexDirection:'row', gap:10 },
  wrapper: { maxWidth:1200, alignSelf:'center', width:'100%' },
  wrapperNarrow: { maxWidth:860, alignSelf:'center', width:'100%' },
  siteNav:{ paddingHorizontal:24, paddingVertical:6, backgroundColor:'#070571', borderBottomWidth:1, borderColor:'rgba(255,255,255,.12)', marginBottom:0 },
  siteNavInner:{ maxWidth:1200, alignSelf:'center', width:'100%', flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center' },
  siteNavItem:{ paddingHorizontal:8, paddingVertical:6, borderRadius:6, backgroundColor:'transparent', borderWidth:0 },
  siteNavText:{ color:'#fff', fontWeight:'700', fontSize:12 },
  topnav: { flexDirection:'row', gap:12, paddingHorizontal:24, paddingVertical:12 },
  navItem: { paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:'#0a0876' },
  navItemActive: { backgroundColor:'#0c0a96' },
  navText: { color:'#fff', fontWeight:'700' },
  heroImg:{ marginHorizontal:0, marginVertical:0, minHeight:'90vh', justifyContent:'center', width:'100%', position:'relative' },
  heroImgInner:{ objectFit:'cover' },
  heroOverlay:{ ...StyleSheet.absoluteFillObject, backgroundImage: 'linear-gradient(to top, #070571 0%, rgba(7,5,113,0.4) 50%, rgba(0,0,0,0.6) 100%)' },
  heroContent:{ paddingHorizontal:24, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  bannerTitle:{ color:'#ffffff', fontWeight:'900', fontSize: 64, textTransform:'uppercase', lineHeight: 64, marginBottom: 16, textShadow: '0 4px 10px rgba(0,0,0,0.5)' },
  h1: { color:'#111827', fontSize:32, fontWeight:'800', letterSpacing: -0.5 },
  p: { color:'#4b5563', fontSize:16, lineHeight: 24 },
  row: { flexDirection:'row', gap:8, alignItems:'center', flexWrap:'wrap' },
  grid: { flexDirection:'row', flexWrap:'wrap', gap:0, marginHorizontal:24 },
  card: { backgroundColor:'#ffffff', padding:16, borderRadius:0, flexGrow:1, flexBasis:'30%', minWidth:300, borderWidth:1, borderColor:'#e5e7eb' },
  cardHover: { transform:[{scale:1.02}] },
  cardTitle: { color:'#111827', fontWeight:'700', marginBottom:8 },
  cardFlagBar:{ flexDirection:'row', height:6, width:'100%', marginHorizontal:-16, marginTop:-16, marginBottom:8, borderTopLeftRadius:0, borderTopRightRadius:0, overflow:'hidden' },
  kpiRow: { flexDirection:'row', gap:10 },
  stat: { backgroundColor:'#f9fafb', borderRadius:16, padding:14, flex:1, alignItems:'center', borderWidth:1, borderColor:'#e5e7eb' },
  statValue: { color:'#111827', fontSize:20, fontWeight:'800' },
  statLabel: { color:'#6b7280', fontSize:12 },
  pillRow: { flexDirection:'row', gap:8, flexWrap:'wrap' },
  pill: { backgroundColor:'#f3f4f6', paddingHorizontal:10, paddingVertical:8, borderRadius:999 },
  pillActive: { backgroundColor:'#e5e7eb' },
  pillText: { color:'#111827', fontSize:12 },
  btn: { backgroundColor:'#049756', paddingHorizontal:16, paddingVertical:12, borderRadius:12 },
  btnDisabled: { opacity:.5 },
  btnGhost: { borderWidth:2, borderColor:'#049756', paddingHorizontal:16, paddingVertical:12, borderRadius:12 },
  btnTextPrimary: { color:'#ffffff', fontWeight:'700' },
  btnTextGhost: { color:'#049756', fontWeight:'700' },
  label: { color:'#374151', fontSize:12, marginBottom:4, marginTop:6 },
  input: { backgroundColor:'#ffffff', borderColor:'#e5e7eb', borderWidth:2, color:'#111827', paddingHorizontal:14, paddingVertical:12, borderRadius:12, marginBottom:8 },
  inputError:{ borderColor:'#C62828' },
  errorText:{ color:'#ffb3b3', fontSize:12, marginTop:-4, marginBottom:6 },
  inputReadonly:{ opacity:.9 },
  inputInline:{ flexDirection:'row', alignItems:'stretch', marginBottom:8 },
  currencyPrefixWrap:{ backgroundColor:'#ffffff', borderColor:'#e5e7eb', borderWidth:2, paddingHorizontal:12, justifyContent:'center', borderTopLeftRadius:12, borderBottomLeftRadius:12 },
  currencyPrefix:{ color:'#111827', fontWeight:'800' },
  labelRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  labelLink:{ color:'#049756', fontSize:12 },
  helperText:{ color:'#c9c7de', fontSize:12, marginTop:4 },
  listItem: { flexDirection:'row', justifyContent:'space-between', backgroundColor:'#f9fafb', padding:12, borderRadius:14, marginBottom:6, borderWidth:1, borderColor:'#e5e7eb' },
  outlineItem:{ backgroundColor:'transparent', borderRadius:0, borderWidth:1, borderColor:'#e5e7eb' },
  outlineCard:{ backgroundColor:'transparent' },
  itemText: { color:'#111827' },
  listColumn: { gap:6 },
  plan: { minWidth:200 },
  planPrice: { color:'#111827', fontWeight:'800', fontSize:18 },
  footer: { marginTop:24, paddingHorizontal:24, paddingVertical:24, backgroundColor:'#ffffff', borderTopWidth:1, borderColor:'#e5e7eb' },
  footerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  footerTitle: { color:'#111827', fontWeight:'800' },
  footerText: { color:'#6b7280' }
  ,newsGrid:{ flexDirection:'row', gap:8, flexWrap:'wrap' }
  ,newsCard:{ backgroundColor:'#ffffff', borderRadius:0, padding:12, minWidth:280, flexBasis:'30%', flexGrow:1, borderWidth:1, borderColor:'#e5e7eb' }
  ,newsImage:{ height:120, borderRadius:0, backgroundColor:'#f3f4f6', marginBottom:8 }
  ,newsTitle:{ color:'#111827', fontWeight:'700', marginBottom:4 }
  ,newsExcerpt:{ color:'#6b7280', marginBottom:8 }
  ,sponsor:{ backgroundColor:'transparent', padding:12, borderRadius:0, minWidth:160, borderWidth:1, borderColor:'#e5e7eb' }
  ,columns:{ flexDirection:'row', gap:16, paddingHorizontal:24, paddingVertical:16, flexWrap:'wrap' }
  ,columns:{ flexDirection:'row', gap:0, paddingHorizontal:24, paddingVertical:0, flexWrap:'wrap' }
  ,colLeft:{ flexGrow:1, flexBasis:'22%', minWidth:260 }
  ,colCenter:{ flexGrow:1, flexBasis:'46%', minWidth:360 }
  ,colRight:{ flexGrow:1, flexBasis:'22%', minWidth:260 }
  ,sectionTitle:{ color:'#111827', fontWeight:'800', marginBottom:8 }
  ,sectionLink:{ color:'#049756', marginTop:8 }
  ,newsListItem:{ paddingVertical:8, borderBottomWidth:1, borderColor:'#e5e7eb' }
  ,newsListText:{ color:'#111827' }
  ,featureCard:{ backgroundColor:'transparent', borderRadius:0, padding:12, marginBottom:0, borderWidth:1, borderColor:'#e5e7eb' }
  ,featureImage:{ height:180, borderRadius:0, backgroundColor:'#f3f4f6', marginBottom:8 }
  ,featureTitle:{ color:'#111827', fontWeight:'800', fontSize:18, marginBottom:4 }
  ,fixtureItem:{ backgroundColor:'transparent', borderRadius:0, padding:10, marginBottom:8, borderWidth:1, borderColor:'#e5e7eb' }
  ,fixtureTitle:{ color:'#111827', fontWeight:'800' }
  ,fixtureText:{ color:'#6b7280' }
  ,serviceItem:{ backgroundColor:'#f9fafb', borderRadius:0, padding:10, marginBottom:0, borderWidth:1, borderColor:'#e5e7eb' }
  ,serviceTitle:{ color:'#111827', fontWeight:'800' }
  ,serviceText:{ color:'#6b7280' }
  ,notice:{ backgroundColor:'transparent', borderRadius:0, padding:12, marginBottom:0, borderWidth:1, borderColor:'#e5e7eb' }
  ,noticeTitle:{ color:'#111827', fontWeight:'800', marginBottom:6 }
  ,pSmall:{ color:'#6b7280', fontSize:12 }
  ,carousel:{ height:220, borderRadius:12, overflow:'hidden', backgroundColor:'#f3f4f6', position:'relative', marginBottom:8 }
  ,carouselImage:{ height:'100%', width:'100%', borderRadius:12, objectFit:'contain', backgroundColor:'rgba(0,0,0,.25)' }
  ,carouselDots:{ position:'absolute', bottom:8, left:0, right:0, flexDirection:'row', justifyContent:'center', gap:6 }
  ,dot:{ width:8, height:8, borderRadius:999, backgroundColor:'rgba(255,255,255,.4)' }
  ,dotActive:{ backgroundColor:'#fff' }
  ,carouselBtn:{ position:'absolute', top:'50%', marginTop:-18, width:36, height:36, borderRadius:999, backgroundColor:'rgba(0,0,0,.25)', alignItems:'center', justifyContent:'center' }
  ,carouselBtnLeft:{ left:8 }
  ,carouselBtnRight:{ right:8 }
  ,carouselBtnText:{ color:'#ffffff', fontSize:22, fontWeight:'800', lineHeight:22 }
  ,sectionBlock:{ paddingHorizontal:24, paddingVertical:8, backgroundColor:'transparent', borderTopWidth:0, borderBottomWidth:1, borderColor:'#e5e7eb' }
  ,sectionLeadImage:{ width:'100%', height:260, objectFit:'cover', backgroundColor:'#f3f4f6' }
  ,cardSquare:{ borderRadius:0 }
  ,cardNeutral:{ backgroundColor:'rgba(0,0,0,.28)', borderWidth:1, borderColor:'rgba(255,255,255,.10)' }
  ,sectionHeader:{ flexDirection:'row', alignItems:'center', gap:10, marginTop:16, marginBottom:6 }
  ,sectionBar:{ width:6, height:24, backgroundColor:'#f42b29', borderRadius:2 }
  ,sectionHeading:{ color:'#111827', fontWeight:'800', textTransform:'uppercase', letterSpacing:.5 }
  ,band:{ width:'100%', paddingVertical:24, position:'relative', overflow:'hidden' }
  ,topWhite:{ backgroundColor:'#ffffff' }
  ,sectionTopBar:{ height:12, flexDirection:'row', marginBottom:12 }
  ,wrapperNarrow:{ maxWidth:860, alignSelf:'center', width:'100%', paddingHorizontal:24 }
  ,bandGreen:{ backgroundColor:'#049756' }
  ,bandRed:{ backgroundColor:'#f42b29' }
  ,bandTri:{
    backgroundImage:'none',
    backgroundRepeat:'no-repeat',
    backgroundSize:'120% 160%',
    backgroundPosition:'center -120px'
  }
  ,bandTriNoticias:{
    backgroundImage:'none',
    backgroundRepeat:'no-repeat',
    backgroundSize:'cover',
    backgroundPosition:'center top',
    backgroundColor:'transparent',
    padding:0,
    backgroundOrigin:'content-box',
    backgroundClip:'content-box'
  }
  ,colBg:{ padding:12, borderRadius:0 }
  ,colBgBlue:{
    backgroundColor:'rgba(255,255,255,.85)',
    borderWidth:1, borderColor:'rgba(255,255,255,.25)',
    boxShadow:'0 6px 20px rgba(0,0,0,.25)',
    backdropFilter:'blur(2px)'
  }
  ,sectionContainer:{ paddingVertical: 40, backgroundColor: '#fff' }
  ,sectionHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 24 }
  ,sectionTitleLarge:{ fontSize: 28, fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: -0.5, scrollMarginTop: 110 }
  ,linkText:{ color: '#049756', fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }
  ,newsGridModern:{ flexDirection: 'row', gap: 24, paddingHorizontal: 24, flexWrap: 'wrap' }
  ,newsFeaturedCol:{ flex: 2, minWidth: 300, height: 400 }
  ,newsFeatured:{ flex: 1, borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }
  ,newsFeaturedBg:{ flex: 1, justifyContent: 'flex-end' }
  ,newsOverlay:{ padding: 24, backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }
  ,newsTag:{ backgroundColor: '#f42b29', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 12 }
  ,newsTagText:{ color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }
  ,newsFeaturedTitle:{ color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 32, marginBottom: 8 }
  ,newsFeaturedExcerpt:{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 24 }
  ,newsSecondaryGrid:{ flex: 1, minWidth: 300, gap: 16 }
  ,newsSecondaryCard:{ flexDirection: 'row', gap: 16, backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' }
  ,newsSecondaryImg:{ width: 80, height: 80, borderRadius: 6, backgroundColor: '#f3f4f6' }
  ,newsSecondaryContent:{ flex: 1 }
  ,newsDate:{ color: '#6b7280', fontSize: 12, marginBottom: 4 }
  ,newsSecondaryTitle:{ color: '#111827', fontWeight: '700', fontSize: 14, lineHeight: 20 }
  ,membershipBanner:{ height: 400, justifyContent: 'center', marginVertical: 40 }
  ,membershipOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,5,113,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }
  ,membershipTitle:{ color: '#fff', fontSize: 48, fontWeight: '900', textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', letterSpacing: -1 }
  ,membershipSubtitle:{ color: 'rgba(255,255,255,0.9)', fontSize: 20, textAlign: 'center', maxWidth: 600, marginBottom: 32, lineHeight: 30 }
  ,rowCenter:{ flexDirection: 'row', justifyContent: 'center' }
  ,btnLg:{ backgroundColor: '#049756', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999, boxShadow: '0 10px 20px rgba(4,151,86,0.4)' }
  ,btnTextLg:{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 }
  ,horizontalScroll:{ paddingHorizontal: 24 }
  ,activityCard:{ width: 280, height: 360, marginRight: 16, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#000' }
  ,activityImg:{ width: '100%', height: '100%', opacity: 0.8 }
  ,activityOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }
  ,activityTitle:{ color: '#fff', fontSize: 24, fontWeight: '800', textTransform: 'uppercase' }
  ,footerContainer:{ backgroundColor: '#0a0a0a', borderTopWidth: 4, borderColor: '#f42b29' }
  ,sponsorsBar:{ backgroundColor: '#fff', paddingVertical: 24, borderBottomWidth: 1, borderColor: '#e5e7eb' }
  ,sponsorsTitle:{ textAlign: 'center', color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }
  ,sponsorsRow:{ flexDirection: 'row', justifyContent: 'center', gap: 40, flexWrap: 'wrap', opacity: 0.5 }
  ,sponsorItem:{ }
  ,sponsorText:{ fontSize: 20, fontWeight: '900', color: '#d1d5db' }
  ,footerMain:{ paddingVertical: 60, paddingHorizontal: 24 }
  ,footerColumns:{ flexDirection: 'row', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', marginBottom: 60 }
  ,footerCol:{ minWidth: 200, flex: 1 }
  ,footerColTitle:{ color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24, borderBottomWidth: 2, borderColor: '#f42b29', paddingBottom: 8, alignSelf: 'flex-start' }
  ,footerLink:{ color: '#9ca3af', fontSize: 14, marginBottom: 12, cursor: 'pointer' }
  ,footerText:{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }
  ,socialRow:{ flexDirection: 'row', gap: 16, marginTop: 16 }
  ,socialIcon:{ color: '#fff', fontSize: 16, fontWeight: '700', backgroundColor: '#374151', width: 32, height: 32, textAlign: 'center', lineHeight: 32, borderRadius: 16 }
  ,footerBottom:{ borderTopWidth: 1, borderColor: '#374151', paddingTop: 24, alignItems: 'center' }
  ,copyright:{ color: '#6b7280', fontSize: 12 }
  // Nuevos estilos para secciones internas
  ,pageHero:{ height: 400, justifyContent: 'center' }
  ,pageHeroOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }
  ,pageHeroTitle:{ color: '#fff', fontSize: 48, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: -1, marginBottom: 16 }
  ,pageHeroSubtitle:{ color: '#e5e7eb', fontSize: 20, textAlign: 'center', maxWidth: 700, lineHeight: 28 }
  
  ,activitiesGrid:{ gap: 32 }
  ,activityBigCard:{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', flexWrap: 'wrap' }
  ,activityBigImg:{ width: '50%', minWidth: 300, height: 400, flex: 1 }
  ,activityBigContent:{ flex: 1, padding: 40, justifyContent: 'center', minWidth: 300 }
  ,activityBigTitle:{ fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 16, textTransform: 'uppercase' }
  ,tag:{ backgroundColor: '#f42b29', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 16 }
  ,tagText:{ color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }
  ,infoBadge:{ backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, marginRight: 8, marginBottom: 16 }
  ,infoBadgeText:{ color: '#374151', fontSize: 13, fontWeight: '600' }
  
  ,activityItemCard:{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderBottomWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' }
  ,activityItemImg:{ width: 120, height: 120 }
  ,activityItemContent:{ flex: 1, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }
  ,activityItemTitle:{ fontSize: 20, fontWeight: '700', color: '#111827' }
  ,activityItemInfo:{ color: '#6b7280', fontSize: 14 }
  
  ,servicesGrid:{ gap: 24 }
  ,serviceCardWide:{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderBottomWidth: 1, borderColor: '#e5e7eb', flexWrap: 'wrap' }
  ,serviceWideImg:{ width: 240, height: '100%', minHeight: 200 }
  ,serviceWideContent:{ flex: 1, padding: 32, minWidth: 300 }
  ,serviceWideTitle:{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 }
  ,btnGhostSmall:{ marginTop: 16 }
  
  ,calloutBox:{ backgroundColor: '#070571', borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 60, backgroundImage: 'linear-gradient(135deg, #070571 0%, #05045a 100%)' }
  ,calloutTitle:{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 12 }
  ,calloutText:{ color: '#d1d5db', fontSize: 16, marginBottom: 24, textAlign: 'center' }
  
  ,pricingGrid:{ flexDirection: 'row', gap: 24, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }
  ,pricingCard:{ flex: 1, minWidth: 300, backgroundColor: '#fff', borderRadius: 16, padding: 32, borderWidth: 1, borderColor: '#e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }
  ,pricingCardFeatured:{ backgroundColor: '#070571', borderColor: '#070571', transform: 'scale(1.05)', zIndex: 10, boxShadow: '0 20px 40px rgba(7,5,113,0.2)' }
  ,pricingTitle:{ fontSize: 18, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 16 }
  ,pricingPrice:{ fontSize: 48, fontWeight: '900', color: '#111827', marginBottom: 24 }
  ,pricingPeriod:{ fontSize: 16, color: '#9ca3af', fontWeight: '500' }
  ,pricingFeature:{ fontSize: 15, color: '#374151', marginBottom: 12 }
  ,divider:{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 24 }
  ,popularTag:{ position: 'absolute', top: 16, right: 16, backgroundColor: '#f42b29', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 }
  ,popularTagText:{ color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }
  ,textWhite:{ color: '#fff' }
  ,textWhiteOpt:{ color: 'rgba(255,255,255,0.6)' }
  ,btnWhite:{ backgroundColor: '#fff', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 }
  ,btnOutline:{ borderWidth: 2, borderColor: '#070571', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', marginTop: 24 }
  ,btnTextOutline:{ color: '#070571', fontWeight: '700', fontSize: 14 }
  
  ,benefitsSection:{ marginTop: 80 }
  ,benefitsGrid:{ flexDirection: 'row', gap: 32, flexWrap: 'wrap', marginTop: 32 }
  ,benefitItem:{ flex: 1, minWidth: 250, padding: 24, backgroundColor: '#f9fafb', borderRadius: 12 }
  ,benefitIcon:{ fontSize: 40, marginBottom: 16 }
  ,benefitTitle:{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }
  ,benefitDesc:{ color: '#6b7280', lineHeight: 24 }
  
  // Estilos Auth y Perfil
  ,authCard:{ backgroundColor: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderWidth: 1, borderColor: '#e5e7eb' }
  ,formTitle:{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' }
  ,formSubtitle:{ fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' }
  ,profileHeader:{ backgroundColor: '#070571', paddingVertical: 40, borderBottomWidth: 4, borderColor: '#f42b29' }
  ,profileTitle:{ color: '#fff', fontSize: 32, fontWeight: '900', textTransform: 'uppercase' }
  ,dashboardGrid:{ flexDirection: 'row', gap: 24, marginBottom: 32 }
  ,dashboardCard:{ flex: 1, backgroundColor: '#fff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' }
  ,statNumber:{ fontSize: 32, fontWeight: '900', color: '#049756', marginBottom: 4 }
  ,statLabel:{ fontSize: 14, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }
  ,sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderColor: '#e5e7eb', paddingBottom: 16 }
  ,sectionHeaderTitle:{ fontSize: 20, fontWeight: '800', color: '#111827', textTransform: 'uppercase' }
  ,tableRow:{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' }
  ,tableCell:{ fontSize: 15, color: '#374151' }
  ,tableCellBold:{ fontSize: 15, color: '#111827', fontWeight: '700' }
  ,statusBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: '#e5e7eb' }
  ,statusText:{ fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase' }
  ,statusSuccess:{ backgroundColor: '#dcfce7' }
  ,statusSuccessText:{ color: '#166534' }
  ,statusError:{ backgroundColor: '#fee2e2' }
  ,statusErrorText:{ color: '#991b1b' }
  ,inputLabel:{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 }
  ,inputModern:{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827', marginBottom: 20 }
  ,pillModern:{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', backgroundColor: '#fff' }
  ,pillModernActive:{ backgroundColor: '#070571', borderColor: '#070571' }
  ,pillTextModern:{ color: '#374151', fontWeight: '600' }
  ,pillTextModernActive:{ color: '#fff' }
  ,socialIconImg:{ width: 24, height: 24, resizeMode: 'contain' }
  ,inputCurrencyWrapper:{ flexDirection:'row', alignItems:'center', paddingVertical:0, paddingHorizontal:0, overflow:'hidden', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 20 }
  ,currencySymbol:{ backgroundColor:'#e5e7eb', paddingHorizontal:16, paddingVertical:14, justifyContent:'center' }
  ,currencyText:{ fontWeight:'800', color:'#374151' }
  ,inputCurrency:{ flex:1, paddingHorizontal:16, paddingVertical:14, fontSize:16, color:'#111827' }
  ,cvvHelpButton:{ color:'#049756', fontSize:12, fontWeight:'600' }
  ,cvvHelpText:{ color:'#6b7280', fontSize:12, marginTop:-10, marginBottom:16 }
  ,emptyState:{ padding: 24, alignItems: 'center' }
  ,sectionSpacer:{ height: 40 }
  ,totalBox:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }
  ,totalLabel:{ fontWeight: '700', color: '#374151' }
  ,totalAmount:{ fontWeight: '900', fontSize: 20, color: '#070571' }
  ,formRow: { flexDirection: 'row', gap: 16 }
  ,formColumn: { flex: 1 }
  ,mb0: { marginBottom: 0 }
  ,mb8: { marginBottom: 8 }
   ,inputError: { borderColor: '#ef4444' }
   ,planSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 }
   ,authBtn: { alignItems: 'center', marginBottom: 16 }
   ,authLink: { textAlign: 'center', color: '#049756', fontWeight: '600' }
   ,authContainer: { maxWidth: 480, alignSelf: 'center', width: '100%' }
   ,profileEmoji: { fontSize: 20 }
  ,dropdown: { position: 'absolute', top: '100%', left: -20, backgroundColor: '#070571', paddingVertical: 0, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10, zIndex: 2000, minWidth: 240, borderTopWidth: 4, borderColor: '#f42b29', borderRadius: 4 }
  ,dropdownItem: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent' }
  ,dropdownItemText: { color: '#fff', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }
  ,inputGroup: { marginBottom: 20, position: 'relative' }
  ,inputModernNoMargin: { marginBottom: 0 }
  ,inputErrorState: { borderColor: '#ef4444', backgroundColor: '#fef2f2' }
  ,inputSuccessState: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' }
  ,validationMessage: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: '600', flexDirection: 'row', alignItems: 'center', gap: 4 }
  ,iconRight: { position: 'absolute', right: 12, top: 14, zIndex: 10 }
  ,btnDisabledState: { opacity: 0.5, backgroundColor: '#9ca3af' }
  ,cardTypeBadge: { position: 'absolute', right: 40, top: 14, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#e5e7eb', borderRadius: 4 }
  ,cardTypeText: { fontSize: 10, fontWeight: '700', color: '#374151' }
});
