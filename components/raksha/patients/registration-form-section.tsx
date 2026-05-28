"use client"

import { useState } from "react"
import { FadeIn } from "../fade-in"

const steps = [
  { id: 1, title: "Patient Info" },
  { id: 2, title: "Medical Details" },
  { id: 3, title: "Hospital & Location" },
]

const trustBadges = [
  "100% free for families",
  "Data encrypted & secure",
  "HIPAA-compliant systems",
  "No spam, ever",
]

export function RegistrationFormSection() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    patientName: "",
    dateOfBirth: "",
    guardianName: "",
    phone: "",
    email: "",
    bloodType: "",
    transfusionFrequency: "",
    lastTransfusion: "",
    hospitalName: "",
    city: "",
    state: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const inputClass =
    "w-full px-4 py-3 font-sans text-base rounded-lg border-0 focus:outline-none focus:ring-1 transition-all"

  return (
    <section
      id="register"
      className="py-24 md:py-32"
      style={{ backgroundColor: "#0A1628" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <span
            className="inline-block text-xs font-sans font-medium tracking-[0.15em] uppercase mb-4"
            style={{ color: "#9B2335" }}
          >
            Get Started
          </span>
          <h2
            className="font-serif text-3xl md:text-5xl font-semibold mb-4"
            style={{ color: "#FAF9F7" }}
          >
            Register your patient
          </h2>
          <p
            className="font-sans text-lg font-light mb-12 max-w-2xl"
            style={{ color: "#6B7280" }}
          >
            Takes about 3 minutes. We&apos;ll start matching donors immediately
            after.
          </p>
        </FadeIn>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <FadeIn delay={0.1}>
              {/* Step tabs */}
              <div className="flex gap-2 mb-8">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className="flex items-center gap-2 px-4 py-2 font-sans text-sm font-medium transition-all"
                    style={{
                      backgroundColor:
                        currentStep === step.id ? "#C0152A" : "transparent",
                      color: "#FAF9F7",
                      border:
                        currentStep === step.id
                          ? "none"
                          : "1px solid #1e293b",
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{
                        backgroundColor:
                          step.id < currentStep ? "#2CA8A0" : "transparent",
                        border:
                          step.id < currentStep ? "none" : "1px solid #6B7280",
                      }}
                    >
                      {step.id < currentStep ? "✓" : step.id}
                    </span>
                    {step.title}
                  </button>
                ))}
              </div>

              {/* Form content */}
              <div
                className="p-8 rounded-2xl"
                style={{ backgroundColor: "#111827" }}
              >
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label
                        className="block font-sans text-sm mb-2"
                        style={{ color: "#FAF9F7" }}
                      >
                        Patient&apos;s Full Name
                      </label>
                      <input
                        type="text"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChange}
                        className={inputClass}
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#FAF9F7",
                        }}
                        placeholder="Enter patient's name"
                      />
                    </div>
                    <div>
                      <label
                        className="block font-sans text-sm mb-2"
                        style={{ color: "#FAF9F7" }}
                      >
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className={inputClass}
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#FAF9F7",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block font-sans text-sm mb-2"
                        style={{ color: "#FAF9F7" }}
                      >
                        Guardian&apos;s Name
                      </label>
                      <input
                        type="text"
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleChange}
                        className={inputClass}
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#FAF9F7",
                        }}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block font-sans text-sm mb-2"
                          style={{ color: "#FAF9F7" }}
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={inputClass}
                          style={{
                            backgroundColor: "#1e293b",
                            color: "#FAF9F7",
                          }}
                          placeholder="+91"
                        />
                      </div>
                      <div>
                        <label
                          className="block font-sans text-sm mb-2"
                          style={{ color: "#FAF9F7" }}
                        >
                          Email (optional)
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={inputClass}
                          style={{
                            backgroundColor: "#1e293b",
                            color: "#FAF9F7",
                          }}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label
                        className="block font-sans text-sm mb-2"
                        style={{ color: "#FAF9F7" }}
                      >
                        Blood Type
                      </label>
                      <select
                        name="bloodType"
                        value={formData.bloodType}
                        onChange={handleChange}
                        className={inputClass}
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#FAF9F7",
                        }}
                      >
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div>
                      <label
                        className="block font-sans text-sm mb-2"
                        style={{ color: "#FAF9F7" }}
                      >
                        Transfusion Frequency
                      </label>
                      <select
                        name="transfusionFrequency"
                        value={formData.transfusionFrequency}
                        onChange={handleChange}
                        className={inputClass}
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#FAF9F7",
                        }}
                      >
                        <option value="">How often?</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="triweekly">Every 3 weeks</option>
                        <option value="monthly">Monthly</option>
                        <option value="variable">Variable</option>
                      </select>
                    </div>
                    <div>
                      <label
                        className="block font-sans text-sm mb-2"
                        style={{ color: "#FAF9F7" }}
                      >
                        Date of Last Transfusion
                      </label>
                      <input
                        type="date"
                        name="lastTransfusion"
                        value={formData.lastTransfusion}
                        onChange={handleChange}
                        className={inputClass}
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#FAF9F7",
                        }}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label
                        className="block font-sans text-sm mb-2"
                        style={{ color: "#FAF9F7" }}
                      >
                        Hospital / Blood Bank Name
                      </label>
                      <input
                        type="text"
                        name="hospitalName"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        className={inputClass}
                        style={{
                          backgroundColor: "#1e293b",
                          color: "#FAF9F7",
                        }}
                        placeholder="Where do transfusions happen?"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block font-sans text-sm mb-2"
                          style={{ color: "#FAF9F7" }}
                        >
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className={inputClass}
                          style={{
                            backgroundColor: "#1e293b",
                            color: "#FAF9F7",
                          }}
                          placeholder="Your city"
                        />
                      </div>
                      <div>
                        <label
                          className="block font-sans text-sm mb-2"
                          style={{ color: "#FAF9F7" }}
                        >
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className={inputClass}
                          style={{
                            backgroundColor: "#1e293b",
                            color: "#FAF9F7",
                          }}
                          placeholder="Your state"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                  {currentStep > 1 ? (
                    <button
                      onClick={prevStep}
                      className="px-6 py-3 font-sans text-sm font-medium border transition-opacity hover:opacity-80"
                      style={{ borderColor: "#FAF9F7", color: "#FAF9F7" }}
                    >
                      Back
                    </button>
                  ) : (
                    <div />
                  )}
                  {currentStep < 3 ? (
                    <button
                      onClick={nextStep}
                      className="px-6 py-3 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#C0152A" }}
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      className="px-8 py-3 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#C0152A" }}
                    >
                      Submit Registration
                    </button>
                  )}
                </div>
              </div>

              {/* Emergency note */}
              <div
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: "#C0152A" }}
              >
                <p
                  className="font-sans text-sm font-medium"
                  style={{ color: "#FAF9F7" }}
                >
                  Need blood urgently?{" "}
                  <a href="tel:+911800RAKSHA" className="underline">
                    Call our emergency line: 1800-RAKSHA
                  </a>
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Trust sidebar */}
          <div className="lg:col-span-1">
            <FadeIn delay={0.2}>
              <div
                className="p-6 rounded-2xl sticky top-24"
                style={{ backgroundColor: "#111827" }}
              >
                <h3
                  className="font-sans text-lg font-semibold mb-6"
                  style={{ color: "#FAF9F7" }}
                >
                  Your trust matters
                </h3>
                <ul className="space-y-4">
                  {trustBadges.map((badge, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        stroke="#22C55E"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span
                        className="font-sans text-sm"
                        style={{ color: "#FAF9F7" }}
                      >
                        {badge}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-8 pt-6 border-t"
                  style={{ borderColor: "#1e293b" }}
                >
                  <p
                    className="font-sans text-sm"
                    style={{ color: "#6B7280" }}
                  >
                    Questions? WhatsApp us at{" "}
                    <a
                      href="https://wa.me/911234567890"
                      style={{ color: "#2CA8A0" }}
                      className="hover:underline"
                    >
                      +91 12345 67890
                    </a>
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}
