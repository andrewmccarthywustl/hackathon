export interface ResearcherProfile {
  name: string;
  email: string;
  institution: string;
  department?: string;
  researchInterests: string[];
  bio?: string;
  homepage?: string;
  orcid?: string;
  googleScholar?: string;
  avatarIcon?: string;
  createdAt: string;
}
