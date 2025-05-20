import { motion } from "framer-motion";
import { Briefcase, Users, Camera, Globe, Star, BookOpen, UserCheck, Gift, Calendar, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

const channelTypes = [
  { icon: <Globe className="h-7 w-7 text-[#653BFB]" />, label: "Website/Software Developers" },
  { icon: <Briefcase className="h-7 w-7 text-[#653BFB]" />, label: "Freelancers" },
  { icon: <Users className="h-7 w-7 text-[#653BFB]" />, label: "Advertising/Marketing Agencies" },
  { icon: <UserPlus className="h-7 w-7 text-[#653BFB]" />, label: "Influencers" },
  { icon: <Camera className="h-7 w-7 text-[#653BFB]" />, label: "Photographers and Catalog Managers" },
];

const benefits = [
  {
    icon: <Star className="h-6 w-6 text-[#2B4EA8]" />,
    title: "Lucrative commissions",
    desc: "Earn lucrative commissions on every successful referral."
  },
  {
    icon: <BookOpen className="h-6 w-6 text-[#2B4EA8]" />,
    title: "Close deals effectively",
    desc: "Close deals with the help of marketing collaterals, support guides, and other resources."
  },
  {
    icon: <UserCheck className="h-6 w-6 text-[#2B4EA8]" />,
    title: "Strengthen credibility",
    desc: "Strengthen your credibility as a company or individual in the market."
  },
  {
    icon: <Users className="h-6 w-6 text-[#2B4EA8]" />,
    title: "Dedicated key account managers",
    desc: "Get support from dedicated key account managers."
  },
];

const whyPartner = [
  {
    icon: <Gift className="h-6 w-6 text-[#653BFB]" />,
    title: "Lucrative Acquisition And Renewal Pay-Outs",
    desc: "When a user from your platform onboards Rocketry Box or renews their plan, you earn a commission."
  },
  {
    icon: <Globe className="h-6 w-6 text-[#653BFB]" />,
    title: "Access to APIs",
    desc: "Integrate Rocketry Box with your platform and provide a customized experience to your clients."
  },
  {
    icon: <BookOpen className="h-6 w-6 text-[#653BFB]" />,
    title: "Partner Training and Knowledge Sharing",
    desc: "Proper training for partners to leave no doubt or confusion and smooth flow of information."
  },
  {
    icon: <Star className="h-6 w-6 text-[#653BFB]" />,
    title: "Exclusive Deals & Discounts",
    desc: "Access to special discounts and curated deals for your customers."
  },
  {
    icon: <Calendar className="h-6 w-6 text-[#653BFB]" />,
    title: "Event Opportunities",
    desc: "Take part in Rocketry Box sponsored events and get leveraged give-aways, promotions, and other activities."
  },
  {
    icon: <UserCheck className="h-6 w-6 text-[#653BFB]" />,
    title: "Dedicated Account Manager",
    desc: "One account manager will be assigned to every partner to assist about the Rocketry Box panel, programs, and other queries."
  },
];

const partnerLogos = [
  { src: "/images/company1.png", alt: "WooCommerce" },
  { src: "/images/company2.png", alt: "Vinculum" },
  { src: "/images/company3.png", alt: "PayPal" },
];

const BecomePartnerPage = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    contact: "",
    address: "",
    service: "",
    business: "",
    timeframe: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: handle form submission (API or email)
    setOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-[#F7F8FF] to-[#E3DFFF] rounded-2xl p-8 mb-16"
      >
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2 text-[#2B4EA8]">
            Channel <span className="text-[#B214E2]">Partners</span>
          </h1>
          <p className="text-lg text-gray-700 mb-6 max-w-xl">
            Fill in the form to register yourself as a channel partner if you are one of the following:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {channelTypes.map((type) => (
              <div key={type.label} className="flex items-center gap-2">
                {type.icon}
                <span className="text-base text-gray-800">{type.label}</span>
              </div>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                className="inline-block bg-[#653BFB] text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-[#2B4EA8] transition"
                onClick={() => setOpen(true)}
              >
                Let's Talk
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle>Schedule A Call With Our Expert</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Full Name" className="border rounded px-3 py-2" />
                  <input name="companyName" value={form.companyName} onChange={handleChange} required placeholder="Company Name" className="border rounded px-3 py-2" />
                  <input name="email" value={form.email} onChange={handleChange} required type="email" placeholder="E-mail" className="border rounded px-3 py-2" />
                  <input name="contact" value={form.contact} onChange={handleChange} required placeholder="Contact Number" className="border rounded px-3 py-2" />
                  <input name="address" value={form.address} onChange={handleChange} required placeholder="Address, City, Pincode, State" className="border rounded px-3 py-2 md:col-span-2" />
                  <select name="service" value={form.service} onChange={handleChange} required className="border rounded px-3 py-2">
                    <option value="">What services do you offer?</option>
                    <option value="shipping">Shipping</option>
                    <option value="fulfillment">Fulfillment</option>
                    <option value="technology">Technology</option>
                    <option value="other">Other</option>
                  </select>
                  <select name="timeframe" value={form.timeframe} onChange={handleChange} required className="border rounded px-3 py-2">
                    <option value="">Are you looking for a timeframe?</option>
                    <option value="immediate">Immediate</option>
                    <option value="1month">Within 1 month</option>
                    <option value="3months">Within 3 months</option>
                    <option value="flexible">Flexible</option>
                  </select>
                  <textarea name="business" value={form.business} onChange={handleChange} required placeholder="Tell us about your business (100 words)" className="border rounded px-3 py-2 md:col-span-2" rows={2} />
                  <button type="submit" className="md:col-span-2 bg-[#653BFB] text-white py-2 rounded font-semibold mt-2 hover:bg-[#2B4EA8] transition">submit</button>
                </form>
                <div className="hidden md:block w-48 flex-shrink-0">
                  <img src="/images/hero.png" alt="Expert" className="w-full h-full object-cover rounded-lg" />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src="/images/hero.png"
            alt="Channel Partner"
            className="w-72 h-72 object-contain rounded-xl shadow-lg bg-white"
          />
        </div>
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-semibold mb-8 text-center text-[#2B4EA8]">
          Benefits of being a Rocketry Box <span className="text-[#B214E2]">channel partner</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
              {benefit.icon}
              <h3 className="font-bold mt-4 mb-2 text-[#2B4EA8]">{benefit.title}</h3>
              <p className="text-gray-700 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Why Partner Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-semibold mb-8 text-center text-[#2B4EA8]">
          Why Partner with <span className="text-[#B214E2]">Rocketry Box?</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {whyPartner.map((item) => (
            <div key={item.title} className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
              {item.icon}
              <h3 className="font-bold mt-4 mb-2 text-[#653BFB]">{item.title}</h3>
              <p className="text-gray-700 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Our Partners Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-semibold text-center mb-4">
          Our <span className="text-[#B214E2]">Partners</span>
        </h2>
        <p className="text-center text-gray-700 mb-6">Join our growing network of partners</p>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {partnerLogos.map((logo) => (
            <img
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              className="h-12 object-contain bg-white rounded shadow p-2"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default BecomePartnerPage; 