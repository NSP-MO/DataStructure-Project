export interface Applicant {
  id: string
  name: string
  address: string
  region: string
  submissionTime: number
  status: "pending" | "verified" | "revision"
}

export interface ApplicationFormData {
  name: string
  address: string
  region: string
}
