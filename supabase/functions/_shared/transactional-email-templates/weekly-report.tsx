import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'EduForYou Unified Hub'

interface Priority {
  title: string
  owner_hint: string
  impact: 'low' | 'medium' | 'high'
}

interface PacePoint {
  period: string
  value: number
}

interface WeeklyReportEmailProps {
  recipientName?: string
  period?: string
  generatedDate?: string
  executiveSummary?: string
  wins?: string[]
  concerns?: string[]
  topPerformer?: { department: string; reason: string }
  underperformer?: { department: string; reason: string; recommendation: string }
  priorities?: Priority[]
  pdfUrl?: string
  paceHistory?: PacePoint[]
}

/**
 * Render an inline SVG sparkline for the PACE Score history.
 * Email-safe: no JS, no external assets, fixed pixel sizes.
 */
function renderPaceSparkline(points: PacePoint[]): string {
  if (!points || points.length < 2) return ''
  const w = 360
  const h = 64
  const padX = 8
  const padY = 10
  const values = points.map((p) => p.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 100)
  const range = max - min || 1
  const stepX = (w - padX * 2) / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = padX + i * stepX
    const y = h - padY - ((p.value - min) / range) * (h - padY * 2)
    return { x, y, value: p.value, period: p.period }
  })
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${h - padY} L ${coords[0].x.toFixed(1)} ${h - padY} Z`
  const last = coords[coords.length - 1]
  const first = coords[0]
  const trendUp = last.value >= first.value
  const stroke = trendUp ? '#10b981' : '#ef4444'
  const fill = trendUp ? '#d1fae5' : '#fee2e2'
  const dots = coords
    .map((c) => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="2.5" fill="${stroke}" />`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="PACE Score trend">
    <path d="${areaPath}" fill="${fill}" opacity="0.6" />
    <path d="${linePath}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    ${dots}
  </svg>`
}

const fallback = {
  period: 'ultima săptămână',
  generatedDate: new Date().toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  executiveSummary: 'Raportul săptămânal este în pregătire.',
  wins: [],
  concerns: [],
  topPerformer: { department: '—', reason: '' },
  underperformer: { department: '—', reason: '', recommendation: '' },
  priorities: [],
}

const WeeklyReportEmail = ({
  recipientName,
  period = fallback.period,
  generatedDate = fallback.generatedDate,
  executiveSummary = fallback.executiveSummary,
  wins = fallback.wins,
  concerns = fallback.concerns,
  topPerformer = fallback.topPerformer,
  underperformer = fallback.underperformer,
  priorities = fallback.priorities,
  pdfUrl,
  paceHistory = [],
}: WeeklyReportEmailProps) => {
  const sparklineSvg = renderPaceSparkline(paceHistory)
  const paceLatest = paceHistory.length > 0 ? paceHistory[paceHistory.length - 1].value : null
  const paceFirst = paceHistory.length > 0 ? paceHistory[0].value : null
  const paceDelta = paceLatest !== null && paceFirst !== null ? Math.round((paceLatest - paceFirst) * 10) / 10 : null
  return (
  <Html lang="ro" dir="ltr">
    <Head />
    <Preview>
      Weekly Executive Report · {period} · {topPerformer.department} top performer
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={headerEyebrow}>EduForYou · Weekly Executive Report</Text>
          <Heading style={headerTitle}>Raport pe {period}</Heading>
          <Text style={headerDate}>{generatedDate}</Text>
        </Section>

        {/* Greeting */}
        {recipientName && (
          <Section style={section}>
            <Text style={greeting}>Salut, {recipientName} 👋</Text>
          </Section>
        )}

        {/* Executive summary */}
        <Section style={section}>
          <Text style={sectionLabel}>Executive summary</Text>
          <Text style={summaryText}>{executiveSummary}</Text>
        </Section>

        {/* PACE Score sparkline (last 6 months) */}
        {sparklineSvg && (
          <Section style={section}>
            <Text style={sectionLabel}>PACE Score · ultimele {paceHistory.length} luni</Text>
            <Section style={sparklineCard}>
              <Section style={sparklineHeader}>
                <Text style={sparklineValue}>{paceLatest}</Text>
                {paceDelta !== null && (
                  <Text style={paceDelta >= 0 ? sparklineDeltaUp : sparklineDeltaDown}>
                    {paceDelta >= 0 ? '▲' : '▼'} {Math.abs(paceDelta)} pts
                  </Text>
                )}
              </Section>
              <div
                style={{ lineHeight: 0, marginTop: '8px' }}
                dangerouslySetInnerHTML={{ __html: sparklineSvg }}
              />
              <Section style={sparklineFooter}>
                <Text style={sparklineFooterText}>{paceHistory[0]?.period}</Text>
                <Text style={sparklineFooterText}>{paceHistory[paceHistory.length - 1]?.period}</Text>
              </Section>
            </Section>
          </Section>
        )}

        {/* PDF download CTA */}
        {pdfUrl && (
          <Section style={ctaSection}>
            <Button href={pdfUrl} style={ctaButton}>
              📄 Descarcă raport PDF complet
            </Button>
            <Text style={ctaNote}>Link valid 30 de zile</Text>
          </Section>
        )}

        {/* Wins */}
        {wins.length > 0 && (
          <Section style={section}>
            <Text style={winsLabel}>✓ Wins săptămâna aceasta</Text>
            {wins.map((w, i) => (
              <Text key={i} style={listItem}>
                • {w}
              </Text>
            ))}
          </Section>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <Section style={section}>
            <Text style={concernsLabel}>⚠ Riscuri & probleme</Text>
            {concerns.map((c, i) => (
              <Text key={i} style={listItem}>
                • {c}
              </Text>
            ))}
          </Section>
        )}

        {/* Top performer */}
        <Section style={section}>
          <Section style={topPerformerCard}>
            <Text style={topPerformerLabel}>🏆 Top performer</Text>
            <Text style={topPerformerName}>{topPerformer.department}</Text>
            <Text style={topPerformerReason}>{topPerformer.reason}</Text>
          </Section>
        </Section>

        {/* Underperformer */}
        <Section style={section}>
          <Section style={underperformerCard}>
            <Text style={underperformerLabel}>⚠ Necesită atenție</Text>
            <Text style={underperformerName}>{underperformer.department}</Text>
            <Text style={underperformerReason}>{underperformer.reason}</Text>
            <Section style={recommendationBox}>
              <Text style={recommendationText}>
                <strong style={{ color: '#dc2626' }}>Recomandare: </strong>
                {underperformer.recommendation}
              </Text>
            </Section>
          </Section>
        </Section>

        {/* Priorities next week */}
        {priorities.length > 0 && (
          <Section style={section}>
            <Text style={prioritiesLabel}>→ Priorități săptămâna următoare</Text>
            {priorities.map((p, i) => (
              <Section key={i} style={priorityRow}>
                <Text style={priorityNumber}>{i + 1}.</Text>
                <Text style={priorityTitle}>{p.title}</Text>
                <Text style={priorityMeta}>
                  Owner sugerat: {p.owner_hint} · Impact: <strong>{p.impact}</strong>
                </Text>
              </Section>
            ))}
          </Section>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Raport generat automat de {SITE_NAME} · AI-powered Chief of Staff
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WeeklyReportEmail,
  subject: (data: Record<string, any>) =>
    `📊 Weekly Report · ${data?.period ?? 'ultima săptămână'}`,
  displayName: 'Weekly Executive Report',
  previewData: {
    recipientName: 'Andrei',
    period: 'ultima lună',
    generatedDate: '20 aprilie 2026',
    executiveSummary:
      'Revenue în creștere cu 12% față de luna trecută. Sales depășește targetul cu 8%, dar Marketing rămâne în urmă pe completion rate (62%). Burn rate stabil, runway 14 luni.',
    wins: [
      'Revenue lunar: 45.200€ (+12% MoM)',
      'Sales: 23 deals închise, conversie 18%',
      'Operations: 94% task completion rate',
    ],
    concerns: [
      'Marketing completion rate scăzut (62%) — 8 task-uri overdue',
      'CAC în creștere cu 15% pe canalul Meta Ads',
      'Engineering: 3 OKR-uri at-risk pentru Q2',
    ],
    topPerformer: {
      department: 'Sales',
      reason: '94% completion rate, depășire target cu 8%, 23 deals închise',
    },
    underperformer: {
      department: 'Marketing',
      reason: '62% completion rate, 8 task-uri overdue, CAC în creștere',
      recommendation:
        'Audit campanii Meta Ads și redistribuire buget către canale cu ROI mai bun',
    },
    priorities: [
      { title: 'Audit complet campanii Meta Ads', owner_hint: 'Marketing Manager', impact: 'high' },
      { title: 'Review pipeline Q2 OKRs Engineering', owner_hint: 'CTO', impact: 'high' },
      { title: 'Optimizare onboarding flow', owner_hint: 'Product Manager', impact: 'medium' },
    ],
    pdfUrl: 'https://example.com/sample-report.pdf',
  },
} satisfies TemplateEntry

// Styles — inline for email compatibility
const main = { backgroundColor: '#f4f4f7', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = {
  maxWidth: '600px',
  margin: '24px auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
}
const header = {
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  padding: '28px 32px',
  color: '#ffffff',
}
const headerEyebrow = {
  fontSize: '11px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#ffffff',
  opacity: 0.85,
  margin: '0 0 8px',
}
const headerTitle = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 4px',
}
const headerDate = { fontSize: '12px', color: '#ffffff', opacity: 0.85, margin: 0 }

const section = { padding: '20px 32px 4px' }
const greeting = { fontSize: '14px', color: '#1f2937', margin: 0 }

const sectionLabel = {
  fontSize: '11px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  color: '#6366f1',
  fontWeight: 700,
  margin: '0 0 8px',
}
const summaryText = { margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#1f2937' }

const ctaSection = { padding: '16px 32px 4px', textAlign: 'center' as const }
const ctaButton = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
  display: 'inline-block',
}
const ctaNote = { fontSize: '11px', color: '#6b7280', marginTop: '8px' }

const winsLabel = { fontSize: '13px', fontWeight: 700, color: '#10b981', margin: '0 0 8px' }
const concernsLabel = { fontSize: '13px', fontWeight: 700, color: '#ef4444', margin: '0 0 8px' }
const prioritiesLabel = { fontSize: '13px', fontWeight: 700, color: '#1f2937', margin: '0 0 12px' }

const listItem = { fontSize: '13px', color: '#374151', margin: '0 0 4px', lineHeight: '1.6' }

const topPerformerCard = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  padding: '16px',
}
const topPerformerLabel = {
  fontSize: '11px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  color: '#059669',
  fontWeight: 700,
  margin: '0 0 6px',
}
const topPerformerName = { fontSize: '16px', fontWeight: 700, color: '#064e3b', margin: '0 0 4px' }
const topPerformerReason = { fontSize: '12px', color: '#065f46', lineHeight: '1.5', margin: 0 }

const underperformerCard = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
}
const underperformerLabel = {
  fontSize: '11px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  color: '#dc2626',
  fontWeight: 700,
  margin: '0 0 6px',
}
const underperformerName = { fontSize: '16px', fontWeight: 700, color: '#7f1d1d', margin: '0 0 4px' }
const underperformerReason = {
  fontSize: '12px',
  color: '#991b1b',
  lineHeight: '1.5',
  margin: '0 0 8px',
}
const recommendationBox = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  padding: '8px 10px',
}
const recommendationText = { fontSize: '12px', color: '#374151', margin: 0, lineHeight: '1.5' }

const priorityRow = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '10px 12px',
  marginBottom: '8px',
}
const priorityNumber = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#6366f1',
  margin: '0 0 4px',
}
const priorityTitle = { fontSize: '13px', fontWeight: 600, color: '#1f2937', margin: '0 0 2px' }
const priorityMeta = { fontSize: '11px', color: '#6b7280', margin: 0 }

const hr = { borderColor: '#e5e7eb', margin: '24px 32px 0' }
const footer = {
  fontSize: '11px',
  color: '#6b7280',
  textAlign: 'center' as const,
  padding: '16px 32px',
  margin: 0,
}
