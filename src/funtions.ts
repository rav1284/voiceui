import { API_BASE_URL } from "./config";

// Upload conversation audio chunk
export const uploadConversationChunk = async (blob: Blob,setConversations:any) => {
  try {

    const formData = new FormData();
    formData.append("file", blob, "recorded_audio.wav");

    // 🚀 Fire-and-forget upload
    fetch(API_BASE_URL+"/upload_audio", {
      method: "POST",
      headers: {
        "Authorization":"ca5839e38a15433e62b39767d6a86eaafba17ea6b3ea61e3b89e2ac46baa874c"
      },
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("📩 Chunk response:", data);
        setConversations(pre => [...pre,{id:pre.length + 1,speaker:'doctor', text:data.speech,timestamp:new Date()}])
        // Optionally update UI with partial transcript
      })
      .catch((err) => console.error("❌ Upload error:", err));
  } catch (err) {
    console.error("Upload failed:", err);
  }
};

export const fetchKeywords = async (
  value: string,
  setKeyWords: any,
  setSummary: any,
  setMedicalRecord?: any) => {
  try {
    let payload = {
      speech: value,
    };

    const res = await fetch(API_BASE_URL + "/extract_keywords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "ca5839e38a15433e62b39767d6a86eaafba17ea6b3ea61e3b89e2ac46baa874c",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success === true) {
      console.log("🧩 Keywords:", data.data.keywords);
      setKeyWords(data.data.keywords);

      if (data.data.summary != null) {
        setSummary(data.data.summary);
      }

      if (data.data.history != null && setMedicalRecord) {
        setMedicalRecord((prev: any) => ({
          ...prev,
          history: data.data.history ?? prev.history,
          symptoms: data.data.chief_complaint ?? prev.symptoms,
          prescription: data.data.actions ?? prev.prescription,
        }));
      }
    } else {
      console.warn("API call unsuccessful:", data.message);
    }

    return data;
  } catch (error) {
    console.error("Error fetching keywords:", error);
  }
};

export const fetchemrdetails = async (
  value: string,
  // setKeyWords: any,
  // setSummary: any,
  setEmrRecord?: any
) => {
  try {
    let payload = {
      speech: value,
    };

    const res = await fetch(API_BASE_URL + "/extract_keywords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "ca5839e38a15433e62b39767d6a86eaafba17ea6b3ea61e3b89e2ac46baa874c",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success === true) {
      
      setEmrRecord((prev: any) => ({
        ...prev,
        chiefComplaint: data.data.chief_complaint?.join(', ') || prev.chiefComplaint,
        history: data.data.history ?? prev.history,
        allergies: data.data.allergies?.join(', ') || prev.allergies,
        diagnosis: data.data.diagnosis
          ? `${data.data.diagnosis.ICD_code || ''} - ${data.data.diagnosis.diagnosis_name || ''}`.trim()
          : prev.diagnosis,
        medicinePrescription: Array.isArray(data.data.medicine_prescription)
          ? data.data.medicine_prescription.every(item => typeof item === 'object' && item !== null && 'medication' in item)
            ? data.data.medicine_prescription
                .map((med: any) => 
                  `${med.medication || ''} - ${med.dosage || ''} - ${med.frequency || ''} - ${med.duration || ''} - ${med.instructions || ''}`
                )
                .join('\n')
            : data.data.medicine_prescription
                .filter((item: any) => typeof item === 'string')
                .join(', ')
          : typeof data.data.medicine_prescription === 'string'
            ? data.data.medicine_prescription
            : prev.medicinePrescription,  
        // medicinePrescription: data.data.medicine_prescription?.map((med: any) =>
        //   `${med.medication} - ${med.dosage} - ${med.frequency} - ${med.duration} - ${med.instructions}`
        // ).join('\n') || prev.medicinePrescription,
        // // medicinePrescription: data.data.medicine_prescription?.join(', '),
        investigations: data.data.investigations?.join(', ') || prev.investigations,
        symptoms: data.data.chief_complaint?.join(', ') ?? prev.symptoms,
        prescription: data.data.medicine_prescription ?? prev.prescription,
        actions: data.data.actions ?? prev.actions,
      }));

    } else {
      console.warn("API call unsuccessful:", data.message);
    }

    return data;
  } catch (error) {
    console.error("❌ Error fetching keywords:", error);
  }
};