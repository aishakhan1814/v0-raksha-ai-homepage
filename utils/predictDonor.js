export async function predictDonorStatus(donorData) {
  const apiUrl = process.env.NEXT_PUBLIC_MODEL_API_URL || 'https://raksha-model-api.onrender.com';
  const response = await fetch(`${apiUrl}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(donorData)
  });

  if (!response.ok) {
    throw new Error('Prediction failed');
  }

  return await response.json();
}
