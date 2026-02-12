import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to a Supabase bucket.
 * Must be called from Client Component.
 */
export async function uploadFile(
    bucket: "clients" | "projects" | "documents",
    file: File,
    folderPath: string = ""
): Promise<string> {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        console.error("Supabase Storage Upload Error:", error);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
}
