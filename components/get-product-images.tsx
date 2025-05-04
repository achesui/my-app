import React, { useState, useRef, useEffect } from "react"; // Added useEffect
import * as ImagePicker from "expo-image-picker";
import {
  View,
  Image,
  Pressable,
  Alert,
  Platform,
  ScrollView,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraIcon, CloseIcon, LeftArrowIcon, RightArrowIcon } from "./icons";
// Asegúrate que este tipo refleje la estructura de tu formulario,
// especialmente que `photos` sea del tipo correcto.
// import { CreateDesignFormType } from "./YourFormTypes";
import { UseFormGetValues } from "react-hook-form";

// Helper para generar un nombre de archivo por defecto si no está disponible
const generateDefaultFilename = (uri: string): string => {
  const timestamp = Date.now();
  // Intenta obtener una extensión básica del URI (puede no ser fiable)
  const uriParts = uri.split('.');
  const extension = uriParts.length > 1 ? uriParts.pop() : 'jpg'; // Default a jpg
  return `image_${timestamp}.${extension}`;
};


export default function GetProductImage({
  onImageSelected,
  getValues,
}: {
  onImageSelected: (images: ImagesType[]) => void; // Actualizado el tipo
  getValues: UseFormGetValues<CreateDesignFormType>;
}) {
  // El estado ahora almacena un array de objetos SelectedImage
  const [images, setImages] = useState<ImagesType[]>(() => {
    const formValue = getValues("images");
    // Verifica si es un array y si los elementos tienen la estructura esperada (opcional pero seguro)
    if (Array.isArray(formValue) && formValue.every(item => item && typeof item.uri === 'string' && typeof item.name === 'string')) {
      return formValue;
    }
    return []; // Devuelve un array vacío si no es válido
  });

  const [showArrow, setShowArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [scrollAreaWidth, setScrollAreaWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // --- Permisos (sin cambios) ---
  const requestMediaPermissions = async () => {
    // ... (código igual)
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso Requerido",
          "Necesitamos acceso a tu galería para seleccionar imágenes."
        );
        return false;
      }
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    // ... (código igual)
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso Requerido",
          "Necesitamos acceso a tu cámara para tomar fotos."
        );
        return false;
      }
    }
    return true;
  };

  // --- Funciones de selección de imagen (MODIFICADAS) ---

  const pickImages = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission || images.length >= 6) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // Usar enum es mejor
        allowsMultipleSelection: true,
        selectionLimit: 6 - images.length, // Límite correcto
        quality: 1,
        // 'presentationStyle' y 'base64' pueden ser útiles a veces, pero no necesarios aquí
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Mapea los assets a objetos { uri, name }
        const newImageObjects: ImagesType[] = result.assets.map((asset) => ({
          uri: asset.uri,
          // Usa asset.fileName si existe, si no, genera uno
          name: asset.fileName || generateDefaultFilename(asset.uri),
        }));

        // Combina los arrays existentes y nuevos
        const combinedImages = [...images, ...newImageObjects];

        // Asegura la unicidad basada en URI (manteniendo el objeto completo)
        // Usar un Map es una forma eficiente de hacerlo
        const uniqueImageMap = new Map<string, ImagesType>();
        combinedImages.forEach(img => uniqueImageMap.set(img.uri, img));
        const uniqueImages = Array.from(uniqueImageMap.values());

        // Limita al máximo de 6 imágenes
        const nextImages = uniqueImages.slice(0, 6);

        setImages(nextImages);
        if (onImageSelected) onImageSelected(nextImages); // Envía el array de objetos
      }
    } catch (error) {
      console.error("Error picking images: ", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  const launchCamera = async () => {
    if (images.length >= 6) {
      Alert.alert("Límite Alcanzado", "Puedes seleccionar hasta 6 imágenes.");
      return;
    }
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchCameraAsync({
        // allowsEditing: true, // Editing puede cambiar el formato/nombre, considera si lo necesitas
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Crea el nuevo objeto SelectedImage
        const newImage: ImagesType = {
          uri: asset.uri,
          // Las fotos de cámara a menudo no tienen 'fileName', así que generamos uno
          name: asset.fileName || generateDefaultFilename(asset.uri),
        };

        // Verifica si una imagen con el mismo URI ya existe
        const uriExists = images.some((img) => img.uri === newImage.uri);

        if (!uriExists) {
          const nextImages = [...images, newImage].slice(0, 6); // Limita a 6
          setImages(nextImages);
          if (onImageSelected) onImageSelected(nextImages); // Envía el array de objetos
        }
      }
    } catch (error) {
      console.error("Error launching camera: ", error);
      Alert.alert("Error", "No se pudo iniciar la cámara.");
    }
  };

  const removeImage = (indexToRemove: number) => {
    // El filter funciona igual para arrays de objetos
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    if (onImageSelected) onImageSelected(newImages); // Envía el array actualizado
  };

  // --- Handlers de Layout y Scroll (sin cambios lógicos) ---
  const handleLayout = (e: any) => {
    setScrollAreaWidth(e.nativeEvent.layout.width);
    // Reevaluar si mostrar flecha basado en el contentWidth actual
    setShowArrow(contentWidth > e.nativeEvent.layout.width + 5);
  };

  const handleContentSizeChange = (w: number, _h: number) => {
    setContentWidth(w);
    setShowArrow(w > scrollAreaWidth + 5);
    // Podrías querer resetear la posición del scroll o las flechas aquí si el contenido se reduce mucho
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, animated: false }); // Opcional: volver al inicio si cambia mucho
      setShowLeftArrow(false); // Ocultar flecha izq al cambiar contenido
    }
  };

  const handleScroll = (e: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const isScrollable = contentSize.width > layoutMeasurement.width + 5; // Margen pequeño

    if (!isScrollable) {
      setShowLeftArrow(false);
      setShowArrow(false);
      return;
    }

    const scrollEndReached = contentOffset.x >= contentSize.width - layoutMeasurement.width - 5; // Margen pequeño al final
    const scrollStartReached = contentOffset.x <= 5; // Margen pequeño al inicio

    setShowArrow(!scrollEndReached);
    setShowLeftArrow(!scrollStartReached);
  };

  // Calcula si los botones deben estar deshabilitados
  const isDisabled = images.length >= 6;

  // --- JSX (MODIFICADO para usar image.uri) ---
  return (
    <View className="w-full items-center mb-5 border border-gray-200 rounded-xl p-4 bg-white">
      {/* Botones Galería y Cámara (sin cambios lógicos, solo estilos) */}
      <View className="flex-row w-full mb-3 gap-2">
        <Pressable
          className="flex-1 justify-center items-center rounded-xl"
          onPress={pickImages}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.buttonBase,
            pressed && !isDisabled && styles.buttonPressed,
            isDisabled && styles.buttonDisabled,
          ]}
        >
          {({ pressed }) => (
            <View className="flex-row items-center justify-center w-full rounded-full py-2">
              {/* ... icono y texto ... */}
              <Ionicons name="images-outline" size={18} color={isDisabled ? "#9ca3af" : pressed ? "#fff" : "#2563eb"} />
              <Text className="font-semibold ml-1" style={{ color: isDisabled ? "#9ca3af" : pressed ? "#fff" : "#2563eb", fontSize: 14 }}>Galería</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          className="flex-1 justify-center items-center"
          onPress={launchCamera}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.buttonBase,
            pressed && !isDisabled && styles.buttonPressed,
            isDisabled && styles.buttonDisabled,
          ]}
        >
          {({ pressed }) => (
            <View className="flex-row items-center justify-center w-full rounded-full py-2">
              {/* ... icono y texto ... */}
              <CameraIcon size={18} color={isDisabled ? "#9ca3af" : pressed ? "#fff" : "#2563eb"} />
              <Text className="font-semibold ml-1" style={{ color: isDisabled ? "#9ca3af" : pressed ? "#fff" : "#2563eb", fontSize: 14 }}>Cámara</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ScrollView de Imágenes */}
      <View className="relative w-full">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="w-full"
          contentContainerClassName="py-1" // Usa className en lugar de Style
          contentContainerStyle={styles.scrollViewContent} // Usa StyleSheet para consistencia
          ref={scrollRef}
          onLayout={handleLayout}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16} // Buena práctica para rendimiento
        >
          {images.length === 0 ? (
            // Placeholder cuando no hay imágenes
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Añade hasta 6 imágenes
              </Text>
            </View>
          ) : (
            // Mapea sobre el array de objetos SelectedImage
            images.map((image, idx) => (
              // Usa image.uri como key (más estable que el index si hay reordenamiento futuro)
              <View key={image.uri} style={styles.imageContainer}>
                <Image
                  source={{ uri: image.uri }} // Extrae el URI del objeto
                  style={styles.image}
                  resizeMode="cover"
                />
                {/* Botón para eliminar la imagen */}
                <Pressable
                  style={styles.closeButton}
                  onPress={() => removeImage(idx)} // Usa el índice para eliminar
                  hitSlop={8} // Área de toque más grande
                >
                  <CloseIcon size={18} color="#fff" />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>

        {/* Flechas de scroll (sin cambios lógicos) */}
        {showArrow && (
          <View pointerEvents="none" style={[styles.arrowOverlay, styles.rightArrow]}>
            <RightArrowIcon size={28} color="#6b7280" />
          </View>
        )}
        {showLeftArrow && (
          <View pointerEvents="none" style={[styles.arrowOverlay, styles.leftArrow]}>
            <LeftArrowIcon size={28} color="#6b7280" />
          </View>
        )}
      </View>

      {/* Contador de imágenes */}
      <Text className="text-xs text-gray-400 mt-2">
        {images.length} de 6 imágenes seleccionadas
      </Text>
    </View>
  );
}

// --- Estilos (Movidos a StyleSheet para mejor organización) ---
const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 999, // Bordes redondeados para botones
    borderWidth: 1,
    borderColor: "#d1d5db", // Borde gris claro
    paddingVertical: 8, // Relleno vertical
    flex: 1, // Ocupa espacio disponible
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: "#eff6ff", // Azul muy claro al presionar (ajusta si prefieres el azul fuerte)
    borderColor: "#3b82f6",
  },
  buttonDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
    opacity: 0.6,
  },
  scrollViewContent: {
    alignItems: "center",
    minHeight: 128, // Altura mínima para el área de scroll
    paddingHorizontal: 5, // Espaciado horizontal interno
  },
  placeholderContainer: {
    width: 128, // Ancho fijo para el placeholder
    height: 128, // Altura fija
    borderRadius: 12,
    backgroundColor: "#f3f4f6", // Gris claro
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d1d5db", // Borde punteado
    marginHorizontal: 'auto' as any, // Centrar si es el único elemento (puede necesitar ajuste según contenedor padre)
  },
  placeholderText: {
    color: "#9ca3af", // Gris medio
    textAlign: "center",
    fontSize: 12,
    paddingHorizontal: 8,
  },
  imageContainer: {
    position: "relative", // Necesario para el botón de cierre absoluto
    width: 128, // Ancho fijo para cada imagen
    height: 128, // Altura fija
    marginRight: 8, // Espacio entre imágenes
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12, // Bordes redondeados para la imagen
  },
  closeButton: {
    position: "absolute",
    top: 4, // Ajusta posición
    right: 4, // Ajusta posición
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo semitransparente
    borderRadius: 999, // Círculo
    padding: 4, // Relleno interno
  },
  arrowOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
    paddingHorizontal: 4,
    // El degradado es difícil de replicar exactamente en StyleSheet sin librerías,
    // usamos un fondo semi-transparente simple. Considera `expo-linear-gradient` si necesitas el degradado.
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  rightArrow: {
    right: 0,
  },
  leftArrow: {
    left: 0,
  }
});