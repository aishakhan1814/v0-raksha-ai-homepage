import { Navbar } from '@/components/raksha/navbar'
import { Footer } from '@/components/raksha/footer'

const stack = [
  {
    layer: 'Frontend',
    color: '#2CA8A0',
    services: ['Next.js 14 (App Router)', 'Vercel Edge Network', 'Tailwind CSS'],
  },
  {
    layer: 'API & Compute',
    color: '#C0152A',
    services: ['AWS Lambda (Python FastAPI)', 'API Gateway (REST)', 'AWS App Runner'],
  },
  {
    layer: 'AI & Intelligence',
    color: '#8B1A2A',
    services: ['Amazon Bedrock (Claude — Care Memory)', 'Amazon SageMaker (Donor Ranking Model)', 'Amazon Translate (12 Indian Languages)'],
  },
  {
    layer: 'Automation & Events',
    color: '#2CA8A0',
    services: ['AWS Step Functions (Outreach Orchestration)', 'Amazon EventBridge (Transfusion Triggers)', 'Amazon SNS / SES (Donor Outreach)'],
  },
  {
    layer: 'Data & Storage',
    color: '#C0152A',
    services: ['Amazon DynamoDB (Donors & Requests)', 'Amazon S3 (Transfusion History)', 'SageMaker Feature Store (Eligibility State)'],
  },
  {
    layer: 'Security & Monitoring',
    color: '#8B1A2A',
    services: ['AWS Secrets Manager (API Keys)', 'Amazon CloudWatch (Dashboards & Alerts)', 'AWS X-Ray (Lambda Tracing)', 'IAM Roles (Least Privilege)'],
  },
  {
    layer: 'DevOps',
    color: '#2CA8A0',
    services: ['GitHub Actions (CI/CD on push to main)', 'AWS SAM (Infrastructure as Code)', 'DPDP Act Compliant — Consent flags in DynamoDB'],
  },
]

const flow = [
  { step: '1', label: 'Patient blood request submitted', detail: 'POST /blood-request → DynamoDB' },
  { step: '2', label: 'EventBridge rule fires', detail: 'Triggers Step Function within <1 sec' },
  { step: '3', label: 'SageMaker ranking Lambda', detail: 'Scores donors: blood type + location + recency + alloimmunization risk' },
  { step: '4', label: 'SNS outreach to top 3 donors', detail: 'SMS + WhatsApp via Amazon Translate in donor language' },
  { step: '5', label: 'Step Function waits 2 hours', detail: 'Polls DynamoDB for confirmation response' },
  { step: '6', label: 'Auto-escalation if no response', detail: 'Contacts next ranked donors, alerts admin via SES' },
  { step: '7', label: 'Bedrock logs outcome', detail: 'Updates care memory, feeds failure learning loop' },
]

export default function TechPage() {
  return (
    <main className="min-h-screen bg-raksha-deep">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        <p className="text-raksha-crimson text-xs uppercase tracking-[0.2em] font-medium mb-4">
          Under the Hood
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-raksha-white mb-6">
          AWS Architecture
        </h1>
        <p className="text-raksha-muted text-lg mb-16 max-w-2xl">
          Raksha AI is built entirely on AWS — seven service layers working together to automate blood coordination in real time.
        </p>

        {/* Stack layers */}
        <div className="space-y-4 mb-20">
          {stack.map((s) => (
            <div
              key={s.layer}
              className="border border-raksha-wine/40 rounded-xl p-6 bg-[#111827] hover:border-raksha-wine transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-6 rounded-sm" style={{ background: s.color }} />
                <h2 className="text-raksha-white font-semibold text-sm uppercase tracking-wider">
                  {s.layer}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.services.map((svc) => (
                  <span
                    key={svc}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 text-raksha-muted border border-white/10"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live flow */}
        <h2 className="font-display text-2xl sm:text-3xl text-raksha-white mb-8">
          What happens when blood is requested
        </h2>
        <div className="space-y-3">
          {flow.map((f) => (
            <div key={f.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-raksha-blood flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                {f.step}
              </div>
              <div className="border-l border-raksha-wine/30 pl-4 pb-4 flex-1">
                <p className="text-raksha-white font-medium text-sm">{f.label}</p>
                <p className="text-raksha-muted text-xs mt-1">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance box */}
        <div className="mt-16 border border-raksha-teal/30 rounded-xl p-6 bg-raksha-teal/5">
          <h3 className="text-raksha-teal font-semibold mb-2">Data Privacy & Compliance</h3>
          <p className="text-raksha-muted text-sm leading-relaxed">
            All donor and patient data is stored with explicit consent flags in DynamoDB. Donors can withdraw consent with a single WhatsApp message. The system is designed to comply with India's Digital Personal Data Protection (DPDP) Act 2023. No data is shared with third parties. All API keys are stored in AWS Secrets Manager — never in code.
          </p>
        </div>

      </div>
      <Footer />
    </main>
  )
}
