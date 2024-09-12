import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import { ChangeEvent, useState } from "react";
import Tesseract from "tesseract.js";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

function App() {
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string[]>();

  function handleFileSubmit({ target: { files } }: ChangeEvent<HTMLInputElement>) {
    if (!files) {
      return;
    }

    setResult(undefined);
    setFile(files[0]);
  }

  function handleClear() {
    setFile(undefined);
    setResult(undefined);
  }

  async function handleScan() {
    setResult(undefined);

    if (!file) {
      return;
    }

    const fileUrl = URL.createObjectURL(file);

    setLoading(true);

    if (file.type.startsWith("image")) {
      try {
        const { data: { lines } } = await Tesseract.recognize(fileUrl, "por", { logger: console.log, });

        setResult(lines.map(({ text }) => text));
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const pdf = await getDocument(fileUrl).promise;
        const results = [];

        for (let page = 1; page <= pdf.numPages; page++) {
          const pageData = await pdf.getPage(page);
          const viewport = pageData.getViewport({ scale: 2, });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await pageData.render({ canvasContext: context!, viewport }).promise;

          const { data: { lines } } = await Tesseract.recognize(canvas, "por", { logger: console.log, });

          results.push(`---------------Página ${page}---------------`, ...lines.map(({ text }) => text));
        }

        setResult(results);
      } catch (err) {
        console.error(err);
      }
    }

    setLoading(false);
  }

  function Result() {
    return (
      <div className="mt-10 flex flex-col">
        <h2 className="text-base font-semibold leading-7 text-gray-900">Resultados do escaneamento para "{file?.name}"</h2>
        <div className="mt-5 bg-slate-200 flex-col space-y-3 rounded-lg hover:cursor-text p-5">
          {
            result?.map(
              (line) => (
                <p className="tracking-wider text-sm">{line}</p>
              )
            )
          }
        </div>
      </div>
    );
  }

  return (
    <div className="2xl:w-1/2 w-full p-10 mx-auto h-full">
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h1 className="text-xl font-semibold leading-7 text-gray-900">Escaneador de arquivos</h1>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="col-span-full">
              <p className="block text-sm font-medium leading-6 text-gray-900">
                Arquivo
              </p>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>{file ? file.name : "Faça o upload de um arquivo"}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSubmit} />
                    </label>
                    {!file && (
                      <p className="pl-1">ou arraste e solte</p>
                    )}
                  </div>
                  <p className="text-xs leading-5 text-gray-600">PNG, JPG, e PDF</p>
                </div>
              </div>
            </div>
          </div>
          {
            loading && (
              <div role="status" className="w-full flex justify-center mt-12">
                <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Carregando...</span>
              </div>
            )
          }
          {
            result && (
              <Result />
            )
          }
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button onClick={handleClear} type="button" className="text-sm font-semibold leading-6 text-gray-900">
          {result ? "Limpar" : "Cancelar"}
        </button>
        <button
          className="disabled:opacity-20 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm enabled:hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          disabled={!file}
          onClick={handleScan}
        >
          Escanear
        </button>
      </div>
    </div>
  )
}

export default App;
