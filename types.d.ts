type ImagesType = {
  uri: string;
  name: string;
};

type DetailsType = {
  size: "auto" | "1024x1536" | "1536x1024";
  quality: "low" | "medium" | "high";
  numberOfImages: number;
}

type CreateDesignFormType = {
  images: ImagesType[];
  designText: string;
  details: DetailsType;
};

/*
size
string or null

Optional
Defaults to auto
The size of the generated images. 
Must be one of 1024x1024, 1536x1024 (landscape), 
1024x1536 (portrait), or auto (default value) 
for gpt-image-1, one of 256x256, 512x512, or 1024x1024 
for dall-e-2, and one of 1024x1024, 1792x1024, or 1024x1792 for dall-e-3.
*/

// Tipo para el resultado de cada subida exitosa (URI local y clave del objeto)
type UploadResult = {
  uri: string;
  key: string;
};

// Tipo para la data recibida del worker (worker) (URL prefirmada y clave del objeto)
type PresignedInfo = {
  url: string;
  key: string;
};