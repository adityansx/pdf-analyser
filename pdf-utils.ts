/**
 * Converts a File object to an ArrayBuffer
 * @param file - The PDF file to convert
 * @returns Promise that resolves with the ArrayBuffer
 */
export const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
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

/**
 * Validates if a file is a PDF
 * @param file - The file to validate
 * @returns Boolean indicating if the file is a PDF
 */
export const isPdfFile = (file: File): boolean => {
  return file.type === "application/pdf"
}
