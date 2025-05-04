"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileIcon, UploadIcon, XIcon, CopyIcon, CheckIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { summarizePdf } from "./actions"

// Pre-defined prompt
// const SUMMARY_PROMPT =
  // "Analyze this PDF document and provide a comprehensive summary. Include the main topics, key findings, and important details. Structure your response with clear sections and bullet points where appropriate."
const SUMMARY_PROMPT = 
  "Analyze the provided multi-page document containing an assessment report. Specifically focus on the section titled \"Executive Summary\", locate the information based on the provided OCR content. Your task is to generate a concise summary that captures the key information presented *only* within this \"Executive Summary\" section. Format the summary using bullet points. Ensure the summary includes the following components: 1. An initial bullet point or two summarizing the overall assessment of the candidate as described in the first paragraph of the Executive Summary. 2. A distinct set of bullet points listing and briefly describing the \"STRENGTHS\" identified in the left-hand column of the table within the Executive Summary. 3. A distinct set of bullet points listing and briefly describing the \"WATCH-OUTS\" identified in the right-hand column of the table within the Executive Summary. Do not include information from other pages (like the Job Description or Glossary) in this summary. The final output should be a single list of bullet points structured to reflect the overall assessment, strengths, and watch-outs."

export default function PDFUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // Function to convert file to arrayBuffer
  const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result)
        } else {
          reject(new Error("Failed to convert file to ArrayBuffer"))
        }
      }
      reader.onerror = () => {
        reject(reader.error)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setArrayBuffer(null)
    setSummary(null)

    const selectedFile = e.target.files?.[0] || null

    // Validate file type
    if (selectedFile && selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      setFile(null)
      e.target.value = ""
      return
    }

    setFile(selectedFile)

    if (selectedFile) {
      try {
        const buffer = await fileToArrayBuffer(selectedFile)
        setArrayBuffer(buffer)
        console.log("ArrayBuffer created:", buffer)
      } catch (err) {
        setError("Failed to process the file")
        console.error(err)
      }
    }
  }

  const clearFile = () => {
    setFile(null)
    setArrayBuffer(null)
    setError(null)
    setSummary(null)
    // Reset the file input
    const fileInput = document.getElementById("pdf-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const generateSummary = async () => {
    if (!file || !arrayBuffer) {
      setError("Please upload a PDF file first")
      return
    }

    setIsGenerating(true)
    setSummary(null)

    try {
      // Convert ArrayBuffer to Uint8Array for API
      const uint8Array = new Uint8Array(arrayBuffer)

      // Call the server action to generate summary
      const generatedSummary = await summarizePdf(uint8Array, file.name, SUMMARY_PROMPT)
      setSummary(generatedSummary)
    } catch (err) {
      console.error("Failed to generate summary:", err)
      setError("Failed to generate summary. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (summary) {
      try {
        await navigator.clipboard.writeText(summary)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>PDF Document Summarizer</CardTitle>
          <CardDescription>Upload a PDF document to generate a summary using Gemini AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="pdf-upload">Upload PDF</Label>
            <div className="flex items-center gap-2">
              <Input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Button variant="outline" size="icon" onClick={clearFile} aria-label="Clear selection">
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {file && (
            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-blue-500" />
                <span className="font-medium">{file.name}</span>
                <span className="ml-auto text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
              {arrayBuffer && (
                <p className="mt-2 text-sm text-muted-foreground">
                  ArrayBuffer created successfully ({arrayBuffer.byteLength} bytes)
                </p>
              )}
            </div>
          )}

          {!file && (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
              <UploadIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Drag and drop a PDF file here, or click the upload button above
              </p>
            </div>
          )}

          <Button className="w-full" onClick={generateSummary} disabled={!file || !arrayBuffer || isGenerating}>
            {isGenerating ? "Generating Summary..." : "Generate Summary with Gemini"}
          </Button>

          {isGenerating && (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-center">
                <p className="text-lg font-medium">Analyzing PDF...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a moment depending on the document size
                </p>
              </div>
            </div>
          )}

          {summary && (
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Summary</h3>
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-1">
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-[300px] pr-4">
                <div className="whitespace-pre-wrap">{summary}</div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Powered by Google Gemini. Only PDF files are accepted. Maximum file size: 10MB
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
