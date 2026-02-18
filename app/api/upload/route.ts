// POST /api/upload — Handle file uploads to Cloudinary
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { uploadToCloudinary, uploadMultipleToCloudinary, type UploadFolder } from '@/lib/cloudinary'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const VALID_FOLDERS: UploadFolder[] = ['profiles', 'listings', 'kyc', 'messages']

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const folder = (formData.get('folder') as string) || 'profiles'

    if (!VALID_FOLDERS.includes(folder as UploadFolder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    // Collect all files from 'file' or 'files' field
    const files: File[] = []
    const singleFile = formData.get('file') as File | null
    const multipleFiles = formData.getAll('files') as File[]

    if (singleFile && singleFile.size > 0) {
      files.push(singleFile)
    }
    for (const f of multipleFiles) {
      if (f && f.size > 0) files.push(f)
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files per upload' }, { status: 400 })
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 5 MB limit` },
          { status: 400 }
        )
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" has unsupported type. Use JPEG, PNG, or WebP.` },
          { status: 400 }
        )
      }
    }

    // Convert File objects to buffers and upload
    const fileBuffers = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        name: file.name,
      }))
    )

    const uploadOptions = {
      folder: folder as UploadFolder,
      userId: user.id,
      maxWidth: folder === 'profiles' ? 600 : folder === 'kyc' ? 2000 : 1200,
      maxHeight: folder === 'profiles' ? 600 : folder === 'kyc' ? 2000 : 1200,
      quality: folder === 'kyc' ? 95 : 80,
    }

    if (files.length === 1) {
      const result = await uploadToCloudinary(fileBuffers[0].buffer, uploadOptions)
      return NextResponse.json({ url: result.url, publicId: result.publicId })
    }

    const results = await uploadMultipleToCloudinary(fileBuffers, uploadOptions)
    return NextResponse.json({
      uploads: results.map((r) => ({ url: r.url, publicId: r.publicId })),
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
