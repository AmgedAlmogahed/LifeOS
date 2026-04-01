"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Uploads a file to Supabase Storage and returns the path or public URL.
 */
export async function uploadFile(bucket: string, path: string, formData: FormData) {
    const supabase = await createClient();
    const file = formData.get("file") as File;

    if (!file) throw new Error("No file provided");

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: "3600",
            upsert: true,
        });

    if (error) throw error;
    return data.path;
}

/**
 * Gets a signed URL for a private file.
 */
export async function getSignedFileUrl(bucket: string, path: string, expiresIn = 3600) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
}

/**
 * Deletes a file from Supabase Storage.
 */
export async function deleteFile(bucket: string, path: string) {
    const supabase = await createClient();
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) throw error;
}
