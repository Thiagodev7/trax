import { CompanyForm } from '@/components/companies/company-form'

export const metadata = {
  title: 'Nova Empresa | Trax',
}

export default function NewClientPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompanyForm />
    </div>
  )
}
