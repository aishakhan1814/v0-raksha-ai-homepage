export async function getPrediction(donorData: {
  cycle_of_donations: number;
  donations_till_date: number;
  total_calls: number;
  frequency_in_days: number;
  registration_date: string;
  last_donation_date: string;
  last_contacted_date: string;
}) {
  try {
    const res = await fetch("https://raksha-model-api.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donorData),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
