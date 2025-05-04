const SERVER_URL = "https://68bb-191-92-0-223.ngrok-free.app";

export const getPresignedUrls = async (
  jwt: string,
  path: string,
  images: ImagesType[]
): Promise<PresignedInfo[] | undefined> => {
  try {
    const url = `${SERVER_URL}/get-presigned-urls`;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ path, images }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      // Intenta leer el cuerpo del error si la respuesta no es OK
      const errorBody = await response.text();
      console.error(
        `getPresignedUrls: Error en respuesta - Status ${response.status}: ${errorBody}`
      ); // <-- LOG G3.2
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("getPresignedUrls: Error en la función:", error); // <-- Usa console.error
    if (error instanceof Error) {
      console.error("getPresignedUrls: Error message:", error.message);
      console.error("getPresignedUrls: Error stack:", error.stack);
    }
    // Considera lanzar el error en lugar de retornar undefined para manejarlo en onSubmit
    // throw error; // Opcional, pero mejor para el manejo de errores
    return undefined;
  }
};

export const uploadFiles = async (
  localFilesData: ImagesType[],
  // Corregido: usa el tipo PresignedInfo[]
  presignedData: PresignedInfo[]
  // Corregido: El tipo de retorno debe ser un array de UploadResult o undefined
): Promise<UploadResult[] | undefined> => {
  // Verificar que las longitudes coincidan
  if (localFilesData.length !== presignedData.length) {
    console.error(
      "uploadFiles Error: La cantidad de archivos locales no coincide con la cantidad de datos prefirmados."
    );
    return undefined;
  }

  console.log(
    `uploadFiles: Iniciando subida para ${localFilesData.length} archivos.`
  );

  try {
    const uploadPromises: Promise<UploadResult>[] = []; // La promesa devolverá UploadResult

    for (let i = 0; i < localFilesData.length; i++) {
      const localFileInfo = localFilesData[i];
      const presignedInfo = presignedData[i]; // Ahora es de tipo PresignedInfo

      const fileUri = localFileInfo.uri;
      const fileName = localFileInfo.name;
      const presignedPutUrl = presignedInfo.url; // <-- Correcto, accede a 'url'
      const objectKey = presignedInfo.key;

      console.log(
        `uploadFiles: Procesando Archivo ${i + 1}: Name='${fileName}', URI='${fileUri}'`
      );
      console.log(`uploadFiles: Usando URL prefirmada: ${presignedPutUrl}`);
      console.log(`uploadFiles: Key del objeto R2: ${objectKey}`);

      // La promesa ahora se tipa para resolver a UploadResult
      const uploadPromise: Promise<UploadResult> =
        (async (): Promise<UploadResult> => {
          // 1. Obtener Blob
          const response = await fetch(fileUri);
          if (!response.ok) {
            throw new Error(
              `Error al obtener blob para ${fileName}: Status ${response.status}`
            );
          }
          const blob = await response.blob();
          console.log(
            `uploadFiles: Blob creado para ${fileName}. Tipo: ${blob.type}, Tamaño: ${blob.size}`
          );

          // 2. Realizar PUT
          const uploadResponse = await fetch(presignedPutUrl, {
            method: "PUT",
            headers: {
              "Content-Type": blob.type || "application/octet-stream",
            },
            body: blob,
          });

          console.log(
            `uploadFiles: Respuesta de subida para ${fileName}: Status ${uploadResponse.status}`
          );

          // 3. Verificar Éxito/Fallo
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse
              .text()
              .catch(() => "No se pudo leer cuerpo de error.");
            console.error(
              `uploadFiles: Error al subir ${fileName} - Status ${uploadResponse.status}: ${errorText}`
            );
            throw new Error(
              `Fallo al subir ${fileName}: Status ${uploadResponse.status}`
            );
          }

          // 4. ¡Éxito! Retornar el objeto { uri, key } de tipo UploadResult
          console.log(
            `uploadFiles: Archivo ${fileName} (key: ${objectKey}) subido exitosamente.`
          );
          return {
            uri: fileUri,
            key: objectKey,
          };
        })().catch((error) => {
          console.error(
            `uploadFiles: Error procesando/subiendo ${fileName}:`,
            error
          );
          throw error;
        });

      uploadPromises.push(uploadPromise);
    } // Fin del bucle for

    console.log("uploadFiles: Esperando que todas las subidas finalicen...");
    // Corregido: El tipo de results debe ser UploadResult[]
    const results: UploadResult[] = await Promise.all(uploadPromises);

    console.log(
      `uploadFiles: ${results.length} archivos subidos exitosamente.`
    );
    console.log("uploadFiles: Resultados:", results);
    return results; // Retorna el array de { uri, key }
  } catch (error) {
    console.error(
      "uploadFiles: Ocurrió un error durante el proceso de subida general:",
      error
    );
    return undefined;
  }
};

export const newGeneration = async (
  details: DetailsType,
  designText: string,
  uploadedFiles: UploadResult[],
  userId: string,
  jwt: string
) => {
  await fetch(`${SERVER_URL}/new-generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      details,
      designText,
      uploadedFiles,
      userId,
      jwt
    }),
  });
  return;
};
