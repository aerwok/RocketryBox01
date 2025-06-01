import { PolicyValues } from "@/lib/validations/policy";
import { ApiService } from "./api.service";

const DEMO_POLICIES: PolicyValues[] = [
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: "This is a demo privacy policy.",
    seoTitle: "Privacy Policy",
    seoDescription: "Demo privacy policy description.",
    seoKeywords: "privacy, policy, demo",
    isPublished: true,
    requiredForSignup: false,
    template: "default",
    version: "1.0",
    lastUpdated: "2024-06-01",
  },
  {
    title: "Terms of Service",
    slug: "terms-of-service",
    content: "This is a demo terms of service.",
    seoTitle: "Terms of Service",
    seoDescription: "Demo terms of service description.",
    seoKeywords: "terms, service, demo",
    isPublished: true,
    requiredForSignup: false,
    template: "default",
    version: "1.0",
    lastUpdated: "2024-06-01",
  },
];

export class PoliciesService {
    private apiService: ApiService;

    constructor() {
        this.apiService = ApiService.getInstance();
    }

    async getPolicyBySlug(slug: string) {
        if (import.meta.env.MODE === "development") {
            let policy = DEMO_POLICIES.find((p) => p.slug === slug);
            if (!policy) policy = DEMO_POLICIES[0]; // fallback to first demo policy
            return { data: policy };
        }
        return this.apiService.get(`/policies/${slug}`);
    }

    async updatePolicy(slug: string, data: PolicyValues) {
        if (import.meta.env.MODE === "development") {
            // Just return the data for demo purposes
            return { data };
        }
        return this.apiService.put(`/policies/${slug}`, data);
    }

    async createPolicy(data: PolicyValues) {
        if (import.meta.env.MODE === "development") {
            // Just return the data for demo purposes
            return { data };
        }
        return this.apiService.post(`/policies`, data);
    }
} 