import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const { strings, target_language, source_language } = await request.json();

    if (!strings || !Array.from(strings) || !target_language) {
      return NextResponse.json(
        { success: false, error: "Invalid input. 'strings' array and 'target_language' are required." },
        { status: 400 }
      );
    }

    const lang = target_language.toLowerCase().trim();
    if (lang === "en" || lang === "english") {
      return NextResponse.json({ translations: strings });
    }

    const db = await getDb();
    const translationsCollection = db.collection("translations");

    // 1. Check MongoDB cache first
    const cachedTranslationsMap = new Map<string, string>();
    const queryList = strings.map((s: string) => s.trim());
    
    const dbResults = await translationsCollection.find({
      original: { $in: queryList },
      target_language: lang
    }).toArray();

    dbResults.forEach((doc: any) => {
      cachedTranslationsMap.set(doc.original, doc.translated);
    });

    // 2. Identify missing strings that need translation
    const missingStrings = queryList.filter((s: string) => !cachedTranslationsMap.has(s));
    
    // 3. Translate missing strings using Gemini if available
    if (missingStrings.length > 0 && apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `You are a professional translator. Translate the following array of English strings into the target language "${lang}".
Maintain exact formatting, symbols, emojis, and special characters (like 🆘, 🤖, ←, 🔍) if present. 
Return ONLY the translated strings as a valid JSON array of strings (e.g. ["अनुवाद 1", "अनुवाद 2"]). 
Do not include any explanation, markdown code blocks, backticks, or other text outside the JSON array.

English strings:
${JSON.stringify(missingStrings, null, 2)}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Clean markdown code block markers
        if (responseText.startsWith("```")) {
          responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        try {
          const parsedTranslations = JSON.parse(responseText);
          if (Array.isArray(parsedTranslations) && parsedTranslations.length === missingStrings.length) {
            const bulkOps = missingStrings.map((original: string, idx: number) => {
              const translated = parsedTranslations[idx] || original;
              cachedTranslationsMap.set(original, translated);
              return {
                updateOne: {
                  filter: { original, target_language: lang },
                  update: { $set: { original, target_language: lang, translated, createdAt: new Date() } },
                  upsert: true
                }
              };
            });

            if (bulkOps.length > 0) {
              await translationsCollection.bulkWrite(bulkOps);
            }
          } else {
            console.warn("Gemini translated array size mismatch or invalid format. Translating individually.", responseText);
            // Fallback: translate individually
            for (const orig of missingStrings) {
              const individualPrompt = `Translate this English text into "${lang}". Maintain exact formatting, symbols, emojis, and special characters. Return ONLY the translated text, nothing else:\n\n${orig}`;
              const indResult = await model.generateContent(individualPrompt);
              const indTranslated = indResult.response.text().trim();
              
              cachedTranslationsMap.set(orig, indTranslated);
              await translationsCollection.updateOne(
                { original: orig, target_language: lang },
                { $set: { original: orig, target_language: lang, translated: indTranslated, createdAt: new Date() } },
                { upsert: true }
              );
            }
          }
        } catch (jsonErr) {
          console.error("JSON parse error on Gemini response:", jsonErr, responseText);
          // Fallback: translate individually on JSON parse failure
          for (const orig of missingStrings) {
            try {
              const individualPrompt = `Translate this English text into "${lang}". Maintain exact formatting, symbols, emojis, and special characters. Return ONLY the translated text, nothing else:\n\n${orig}`;
              const indResult = await model.generateContent(individualPrompt);
              const indTranslated = indResult.response.text().trim();
              
              cachedTranslationsMap.set(orig, indTranslated);
              await translationsCollection.updateOne(
                { original: orig, target_language: lang },
                { $set: { original: orig, target_language: lang, translated: indTranslated, createdAt: new Date() } },
                { upsert: true }
              );
            } catch (indErr) {
              console.error(`Failed to translate string individually: ${orig}`, indErr);
              cachedTranslationsMap.set(orig, orig); // fallback to original
            }
          }
        }
      } catch (geminiErr) {
        console.error("Gemini Translation API failed:", geminiErr);
        // Fallback to original text for missing strings on failure
        missingStrings.forEach((s: string) => {
          cachedTranslationsMap.set(s, s);
        });
      }
    } else if (missingStrings.length > 0) {
      // No API key, fallback to original text for missing
      missingStrings.forEach((s: string) => {
        cachedTranslationsMap.set(s, s);
      });
    }

    // 4. Construct final translations array in original order
    const finalTranslations = strings.map((s: string) => {
      const trimmed = s.trim();
      return cachedTranslationsMap.get(trimmed) || s;
    });

    return NextResponse.json({ translations: finalTranslations });
  } catch (error: any) {
    console.error("Translation API internal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
