import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sections = await db.siteContent.findMany({
      orderBy: { sectionKey: 'asc' },
    })

    // Parse all sections into a map
    const contentMap: Record<string, Record<string, unknown>> = {}
    for (const s of sections) {
      contentMap[s.sectionKey] = s.content as Record<string, unknown>
    }

    // Also fetch plans for featuredPlans section
    const plans = await db.tourPlan.findMany({
      where: { published: true },
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
      take: 6,
      orderBy: { sortOrder: 'asc' },
    })

    // Also fetch testimonials
    const testimonials = await db.testimonial.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      take: 6,
    })

    const html = generatePreviewHTML(contentMap, plans, testimonials)

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('Preview generation error:', error)
    return new NextResponse('<html><body><h1>Error generando vista previa</h1></body></html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generatePreviewHTML(
  contentMap: Record<string, Record<string, unknown>>,
  plans: Array<Record<string, unknown>>,
  testimonials: Array<Record<string, unknown>>
): string {
  const hero = contentMap.hero || {}
  const featuredPlans = contentMap.featuredPlans || {}
  const carousel = contentMap.carousel || {}
  const groupTrips = contentMap.groupTrips || {}
  const customTrips = contentMap.customTrips || {}
  const contact = contentMap.contact || {}
  const policies = contentMap.policies || {}
  const campaign = contentMap.campaign || {}
  const seo = contentMap.seo || {}

  // Build sections based on homeConfig order
  const homeConfig = contentMap.homeConfig || {}
  const order = (homeConfig.order as string[]) || ['hero', 'plans', 'testimonials', 'contact']
  const active = (homeConfig.active as Record<string, boolean>) || {}

  const planCards = plans.map((p) => {
    const images = p.images as Array<Record<string, unknown>> | undefined
    const firstImage = images && images.length > 0 ? images[0].url : ''
    const category = p.category as Record<string, unknown> | null
    return `
      <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:transform 0.2s;">
        ${firstImage ? `<img src="${escapeHtml(String(firstImage))}" alt="${escapeHtml(String(p.name || ''))}" style="width:100%;height:200px;object-fit:cover;" onerror="this.style.display='none'" />` : `<div style="width:100%;height:200px;background:linear-gradient(135deg,#0e7490,#14b8a6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;">⛰️</div>`}
        <div style="padding:16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            ${category ? `<span style="font-size:11px;padding:2px 8px;border-radius:12px;background:${escapeHtml(String(category.color || '#0e7490'))};color:#fff;">${escapeHtml(String(category.name || ''))}</span>` : ''}
            ${p.difficulty ? `<span style="font-size:11px;color:#64748b;">${escapeHtml(String(p.difficulty))}</span>` : ''}
          </div>
          <h3 style="margin:0 0 4px;font-size:16px;color:#1e293b;">${escapeHtml(String(p.name || ''))}</h3>
          ${p.location ? `<p style="margin:0 0 4px;font-size:13px;color:#64748b;">📍 ${escapeHtml(String(p.location))}</p>` : ''}
          ${p.shortDescription ? `<p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.4;">${escapeHtml(String(p.shortDescription)).slice(0, 100)}...</p>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:18px;font-weight:700;color:#0e7490;">$${Number(p.price || 0).toLocaleString('es-CO')}</span>
            ${p.duration ? `<span style="font-size:12px;color:#64748b;">⏱ ${escapeHtml(String(p.duration))}</span>` : ''}
          </div>
        </div>
      </div>`
  }).join('')

  const testimonialCards = testimonials.map((t) => `
    <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0e7490,#14b8a6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">
          ${escapeHtml(String(t.name || 'A')).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style="margin:0;font-weight:600;color:#1e293b;">${escapeHtml(String(t.name || ''))}</p>
          ${t.tripName ? `<p style="margin:0;font-size:12px;color:#64748b;">${escapeHtml(String(t.tripName))}</p>` : ''}
        </div>
        <div style="margin-left:auto;color:#f59e0b;">${'★'.repeat(Math.round(Number(t.rating || 5)))}</div>
      </div>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;font-style:italic;">"${escapeHtml(String(t.text || ''))}"</p>
    </div>
  `).join('')

  // Campaign banner
  const campaignBanner = campaign.active
    ? `<div style="background:linear-gradient(90deg,#0e7490,#14b8a6);color:#fff;text-align:center;padding:10px 20px;font-size:14px;">
        ${escapeHtml(String(campaign.bannerText || ''))} 
        <a href="${escapeHtml(String(campaign.ctaUrl || '#'))}" style="color:#fff;font-weight:700;text-decoration:underline;margin-left:8px;">${escapeHtml(String(campaign.ctaText || ''))}</a>
      </div>`
    : ''

  // Build ordered sections
  let sectionsHtml = ''
  for (const section of order) {
    if (active[section] === false) continue

    switch (section) {
      case 'hero':
        sectionsHtml += `
        <section style="background:linear-gradient(135deg,#0c4a6e 0%,#0e7490 40%,#14b8a6 100%);color:#fff;padding:80px 20px;text-align:center;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 120%22><path d=%22M0,80 C150,20 350,100 500,50 C650,0 750,90 900,40 C1000,10 1100,70 1200,30 L1200,120 L0,120 Z%22 fill=%22rgba(255,255,255,0.05)%22/></svg>') bottom/100% auto no-repeat;"></div>
          <div style="position:relative;z-index:1;max-width:800px;margin:0 auto;">
            ${hero.brandLabel ? `<span style="display:inline-block;padding:4px 16px;border:1px solid rgba(255,255,255,0.3);border-radius:20px;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">${escapeHtml(String(hero.brandLabel))}</span>` : ''}
            <h1 style="font-size:48px;font-weight:800;margin:0 0 16px;line-height:1.1;">
              ${escapeHtml(String(hero.title || ''))} <span style="color:#5eead4;">${escapeHtml(String(hero.titleHighlight || ''))}</span>
            </h1>
            ${hero.subtitle ? `<p style="font-size:18px;opacity:0.9;margin:0 0 32px;">${escapeHtml(String(hero.subtitle))}</p>` : ''}
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              ${hero.ctaPlans ? `<a href="#plans" style="display:inline-block;padding:12px 32px;background:#fff;color:#0e7490;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px;">${escapeHtml(String(hero.ctaPlans))}</a>` : ''}
              ${hero.ctaCabins ? `<a href="#contact" style="display:inline-block;padding:12px 32px;border:1px solid rgba(255,255,255,0.5);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px;">${escapeHtml(String(hero.ctaCabins))}</a>` : ''}
            </div>
          </div>
        </section>`
        break

      case 'plans':
        sectionsHtml += `
        <section id="plans" style="padding:60px 20px;background:#f8fafc;">
          <div style="max-width:1200px;margin:0 auto;text-align:center;">
            <h2 style="font-size:32px;font-weight:700;color:#1e293b;margin:0 0 8px;">
              ${escapeHtml(String(featuredPlans.title || 'Planes Destacados'))}
            </h2>
            ${featuredPlans.subtitle ? `<p style="font-size:16px;color:#64748b;margin:0 0 40px;">${escapeHtml(String(featuredPlans.subtitle))}</p>` : ''}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;">
              ${planCards || '<p style="color:#94a3b8;">No hay planes publicados</p>'}
            </div>
          </div>
        </section>`
        break

      case 'testimonials':
        sectionsHtml += `
        <section style="padding:60px 20px;background:#fff;">
          <div style="max-width:1200px;margin:0 auto;text-align:center;">
            <h2 style="font-size:32px;font-weight:700;color:#1e293b;margin:0 0 40px;">Lo que dicen nuestros viajeros</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">
              ${testimonialCards || '<p style="color:#94a3b8;">No hay testimonios</p>'}
            </div>
          </div>
        </section>`
        break

      case 'groups':
        const groupBenefits = (groupTrips.benefits as Array<Record<string, string>>) || []
        const groupStats = (groupTrips.stats as Array<Record<string, string>>) || []
        sectionsHtml += `
        <section style="padding:60px 20px;background:linear-gradient(135deg,#0e7490,#14b8a6);color:#fff;">
          <div style="max-width:1000px;margin:0 auto;text-align:center;">
            ${groupTrips.label ? `<span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">${escapeHtml(String(groupTrips.label))}</span>` : ''}
            <h2 style="font-size:32px;font-weight:700;margin:8px 0 16px;">
              ${escapeHtml(String(groupTrips.title || ''))} <span style="color:#5eead4;">${escapeHtml(String(groupTrips.titleHighlight || ''))}</span>
            </h2>
            ${groupTrips.description ? `<p style="font-size:16px;opacity:0.9;margin:0 0 40px;max-width:600px;margin-left:auto;margin-right:auto;">${escapeHtml(String(groupTrips.description))}</p>` : ''}
            ${groupBenefits.length > 0 ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;text-align:left;margin-bottom:40px;">
              ${groupBenefits.map((b) => `
                <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:20px;">
                  <h3 style="margin:0 0 8px;font-size:16px;">✅ ${escapeHtml(b.title || '')}</h3>
                  <p style="margin:0;font-size:14px;opacity:0.85;">${escapeHtml(b.description || '')}</p>
                </div>
              `).join('')}
            </div>` : ''}
            ${groupStats.length > 0 ? `
            <div style="display:flex;gap:40px;justify-content:center;flex-wrap:wrap;">
              ${groupStats.map((s) => `
                <div>
                  <p style="font-size:36px;font-weight:800;margin:0;">${escapeHtml(s.value || '0')}</p>
                  <p style="font-size:13px;opacity:0.8;margin:0;">${escapeHtml(s.label || '')}</p>
                </div>
              `).join('')}
            </div>` : ''}
          </div>
        </section>`
        break

      case 'custom':
        const customBenefits = (customTrips.benefits as Array<Record<string, string>>) || []
        sectionsHtml += `
        <section style="padding:60px 20px;background:#f8fafc;">
          <div style="max-width:1000px;margin:0 auto;text-align:center;">
            ${customTrips.label ? `<span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0e7490;">${escapeHtml(String(customTrips.label))}</span>` : ''}
            <h2 style="font-size:32px;font-weight:700;color:#1e293b;margin:8px 0 16px;">
              ${escapeHtml(String(customTrips.title || ''))} <span style="color:#0e7490;">${escapeHtml(String(customTrips.titleHighlight || ''))}</span>
            </h2>
            ${customTrips.description ? `<p style="font-size:16px;color:#64748b;margin:0 0 40px;max-width:600px;margin-left:auto;margin-right:auto;">${escapeHtml(String(customTrips.description))}</p>` : ''}
            ${customBenefits.length > 0 ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;text-align:left;margin-bottom:40px;">
              ${customBenefits.map((b) => `
                <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                  <h3 style="margin:0 0 8px;font-size:16px;color:#1e293b;">✨ ${escapeHtml(b.title || '')}</h3>
                  <p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(b.description || '')}</p>
                </div>
              `).join('')}
            </div>` : ''}
            ${customTrips.ctaTitle ? `
            <div style="background:linear-gradient(135deg,#0e7490,#14b8a6);border-radius:16px;padding:40px;color:#fff;margin-top:24px;">
              <h3 style="margin:0 0 8px;font-size:24px;">${escapeHtml(String(customTrips.ctaTitle))}</h3>
              <p style="margin:0 0 24px;opacity:0.9;">${escapeHtml(String(customTrips.ctaDescription || ''))}</p>
              <div style="display:flex;gap:12px;justify-content:center;">
                ${customTrips.ctaContact ? `<a href="#contact" style="padding:12px 32px;background:#fff;color:#0e7490;border-radius:8px;font-weight:600;text-decoration:none;">${escapeHtml(String(customTrips.ctaContact))}</a>` : ''}
              </div>
            </div>` : ''}
          </div>
        </section>`
        break

      case 'contact':
        sectionsHtml += `
        <section id="contact" style="padding:60px 20px;background:#fff;">
          <div style="max-width:800px;margin:0 auto;text-align:center;">
            ${contact.badge ? `<span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0e7490;">${escapeHtml(String(contact.badge))}</span>` : ''}
            <h2 style="font-size:32px;font-weight:700;color:#1e293b;margin:8px 0 16px;">
              ${escapeHtml(String(contact.title || 'Contacto'))} <span style="color:#0e7490;">${escapeHtml(String(contact.titleHighlight || ''))}</span>
            </h2>
            ${contact.subtitle ? `<p style="font-size:16px;color:#64748b;margin:0 0 40px;">${escapeHtml(String(contact.subtitle))}</p>` : ''}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px;text-align:center;">
              ${contact.whatsapp ? `<div style="background:#f8fafc;border-radius:12px;padding:20px;"><p style="font-size:24px;margin:0 0 8px;">💬</p><p style="margin:0;font-weight:600;color:#1e293b;">WhatsApp</p><p style="margin:4px 0 0;font-size:14px;color:#64748b;">${escapeHtml(String(contact.whatsapp))}</p></div>` : ''}
              ${contact.email ? `<div style="background:#f8fafc;border-radius:12px;padding:20px;"><p style="font-size:24px;margin:0 0 8px;">📧</p><p style="margin:0;font-weight:600;color:#1e293b;">Email</p><p style="margin:4px 0 0;font-size:14px;color:#64748b;">${escapeHtml(String(contact.email))}</p></div>` : ''}
              ${contact.location ? `<div style="background:#f8fafc;border-radius:12px;padding:20px;"><p style="font-size:24px;margin:0 0 8px;">📍</p><p style="margin:0;font-weight:600;color:#1e293b;">Ubicación</p><p style="margin:4px 0 0;font-size:14px;color:#64748b;">${escapeHtml(String(contact.location))}</p></div>` : ''}
              ${contact.hours ? `<div style="background:#f8fafc;border-radius:12px;padding:20px;"><p style="font-size:24px;margin:0 0 8px;">🕐</p><p style="margin:0;font-weight:600;color:#1e293b;">Horario</p><p style="margin:4px 0 0;font-size:14px;color:#64748b;">${escapeHtml(String(contact.hours))}</p></div>` : ''}
            </div>
          </div>
        </section>`
        break

      case 'gallery':
      case 'influencer':
      case 'international':
      case 'stats':
      case 'team':
        // These sections don't have dedicated editors, show a placeholder
        sectionsHtml += `
        <section style="padding:40px 20px;background:#f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:14px;">Sección "${escapeHtml(section)}" — Los datos de esta sección se administran desde el CMS</p>
        </section>`
        break
    }
  }

  // Policies footer section
  const bookingPolicies = (policies.bookingPolicies as Array<Record<string, string>>) || []
  const cancellationPolicies = (policies.cancellationPolicies as Array<Record<string, string>>) || []

  const policiesHtml = (bookingPolicies.length > 0 || cancellationPolicies.length > 0) ? `
    <section style="padding:40px 20px;background:#f8fafc;">
      <div style="max-width:800px;margin:0 auto;">
        ${bookingPolicies.length > 0 ? `
        <div style="margin-bottom:32px;">
          ${policies.bookingTitle ? `<h3 style="font-size:20px;font-weight:600;color:#1e293b;margin:0 0 16px;">${escapeHtml(String(policies.bookingTitle))}</h3>` : ''}
          ${bookingPolicies.map((p) => `
            <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <h4 style="margin:0 0 4px;font-weight:600;color:#1e293b;">${escapeHtml(p.title || '')}</h4>
              <p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(p.content || '')}</p>
            </div>
          `).join('')}
        </div>` : ''}
        ${cancellationPolicies.length > 0 ? `
        <div>
          ${policies.cancellationTitle ? `<h3 style="font-size:20px;font-weight:600;color:#1e293b;margin:0 0 16px;">${escapeHtml(String(policies.cancellationTitle))}</h3>` : ''}
          ${cancellationPolicies.map((p) => `
            <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <h4 style="margin:0 0 4px;font-weight:600;color:#1e293b;">${escapeHtml(p.title || '')}</h4>
              <p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(p.content || '')}</p>
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    </section>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${seo.metaTitle ? `<title>${escapeHtml(String(seo.metaTitle))}</title>` : '<title>Vive Travel — Vista Previa</title>'}
  ${seo.metaDescription ? `<meta name="description" content="${escapeHtml(String(seo.metaDescription))}">` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
    a { transition: opacity 0.2s; }
    a:hover { opacity: 0.85; }
    .preview-bar { background: #0e7490; color: #fff; padding: 8px 20px; text-align: center; font-size: 13px; position: sticky; top: 0; z-index: 100; }
    .preview-bar span { opacity: 0.8; }
  </style>
</head>
<body>
  <div class="preview-bar">
    📱 Vista previa del sitio &middot; <span>Los datos se actualizan desde el CMS</span>
  </div>
  ${campaignBanner}
  ${sectionsHtml}
  ${policiesHtml}
  <footer style="background:#0f172a;color:#94a3b8;padding:40px 20px;text-align:center;">
    <p style="margin:0;font-size:14px;">&copy; ${new Date().getFullYear()} Vive Travel. Todos los derechos reservados.</p>
    ${policies.footerText ? `<p style="margin:8px 0 0;font-size:12px;opacity:0.7;">${escapeHtml(String(policies.footerText))}</p>` : ''}
  </footer>
</body>
</html>`
}
