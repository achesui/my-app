import { getPresignedUrls, newGeneration, uploadFiles } from "@/lib/server";
import { supabase } from "@/lib/supabase";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FirstStep } from "./components/first-step";
import { SecondStep } from "./components/second-step";
import { Stepper } from "./components/stepper";
import { ThirdStep } from "./components/third-step";

const MAX_STEPS = 3;

export default function Create() {
  const [step, setStep] = useState(1);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
    watch, // Add watch to get live updates for the slider value display
    setValue, // Add setValue to update form state from slider/buttons
  } = useForm<CreateDesignFormType>({
    defaultValues: {
      designText: "",
      details: {
        size: "auto", // Default size
        quality: "medium", // Default quality
        numberOfImages: 1, // Default number of images
      },
      images: [],
    },
  });

  // Watch the numberOfImages value to display it next to the slider
  const numberOfImages = watch("details.numberOfImages");

  // Animación de slide tipo carrusel
  const animateStep = (direction: 'left' | 'right', nextStep: number) => {
    animation.setValue(0);
    setSlideDirection(direction);
    setPendingStep(nextStep);
    Animated.timing(animation, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      setPendingStep(null);
      setSlideDirection(null);
    });
  };

  // Validar el campo del paso actual antes de avanzar
  const handleNext = async () => {
    let valid = false;
    if (step === 1) {
      valid = await trigger("images");
    } else if (step === 2) {
      valid = await trigger("designText");
    } else if (step === 3) {
      valid = await trigger("details");
    }
    if (valid || step === 3) {
      animateStep('left', Math.min(step + 1, MAX_STEPS));
    }
  };

  const handleBack = () => {
    animateStep('right', Math.max(step - 1, 1));
  };

  const onSubmit = async (data: CreateDesignFormType) => {
    try {
      const { details, designText } = data

      const sessionData = await supabase.auth.getSession();
      if (!sessionData.data.session?.access_token) {
        return;
      }

      const userId = sessionData.data.session.user.id

      const presignedUrls = await getPresignedUrls(
        sessionData.data.session.access_token,
        `/users/${userId}/temporal`,
        data.images
      );

      console.log("presignedUrlspresignedUrls : ", presignedUrls)
      if (!presignedUrls || presignedUrls.length === 0) {
        console.log("onSubmit: No se obtuvieron URLs prefirmadas válidas.");
        return;
      }

      const uploadedFiles = await uploadFiles(data.images, presignedUrls);

      // validar esto con un setError para feedback al usuario.
      console.log("archivos subidos: ", uploadedFiles)
      if (!uploadedFiles || uploadedFiles.length === 0) {
        console.log("onSubmit: No se subieron archivos.");
        return;
      }

      const generationResult = await newGeneration(
        details,
        designText,
        uploadedFiles,
        userId,
        sessionData.data.session.access_token,
      )

    } catch (error) {
      // Asegúrate de que el error se muestre completo
      console.error("onSubmit: Error:", error); // <-- Usa console.error para errores
      if (error instanceof Error) {
        console.error("onSubmit: Error message:", error.message);
        console.error("onSubmit: Error stack:", error.stack);
      }
    }
  };

  // Renderiza el contenido de cada paso
  const renderStepContent = (stepToRender: number) => {
    // Correctly return the component if the condition is met
    if (stepToRender === 1) {
      return (
        <FirstStep
          control={control}
          errors={errors}
          getValues={getValues}
        />
      );
    }

    if (stepToRender === 2) {
      return (
        <SecondStep
          control={control}
          errors={errors}
          getValues={getValues}
        />
      )
    }

    if (stepToRender === 3) {
      return (<ThirdStep
        control={control}
        errors={errors}
        getValues={getValues}
        numberOfImages={numberOfImages}
      />)
    }
    return null;
  };

  // Animación tipo carrusel para ambos pasos
  let currentTranslate: Animated.AnimatedInterpolation<number> = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -screenWidth] });
  let nextTranslate: Animated.AnimatedInterpolation<number> = animation.interpolate({ inputRange: [0, 1], outputRange: [screenWidth, 0] });
  if (slideDirection === 'left') {
    currentTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -screenWidth] });
    nextTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [screenWidth, 0] });
  } else if (slideDirection === 'right') {
    currentTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [0, screenWidth] });
    nextTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] });
  }

  return (
    <View className="flex-1 bg-white">
      <Stepper step={step} />
      <View style={{ width: '100%', overflow: 'hidden', flex: 1 }}>
        {/* Paso actual */}
        <Animated.View
          style={{
            position: slideDirection ? 'absolute' : 'relative',
            width: '100%',
            height: '100%',
            transform: slideDirection ? [{ translateX: currentTranslate }] : [],
            zIndex: slideDirection ? 1 : undefined,
          }}
          pointerEvents={slideDirection ? 'none' : 'auto'}
        >
          {renderStepContent(step)}
        </Animated.View>
        {/* Paso siguiente/anterior, solo durante la animación */}
        {slideDirection && pendingStep && (
          <Animated.View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: [{ translateX: nextTranslate }],
              zIndex: 2,
            }}
            pointerEvents="none"
          >
            {renderStepContent(pendingStep)}
          </Animated.View>
        )}
      </View>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom,
          zIndex: 10,
        }}
        className="flex-row bg-white"
      >
        {step > 1 && (
          <Pressable
            onPress={handleBack}
            className="bg-gray-100 p-4 flex-1 items-center"
          >
            <Text className="text-gray-800 text-center font-semibold">Atrás</Text>
          </Pressable>
        )}
        {step < MAX_STEPS ? (
          <Pressable
            onPress={handleNext}
            className={`bg-blue-500 p-4 items-center ${step > 1 ? "flex-1" : "flex-[2]"}`}
          >
            <Text className="text-white text-center font-semibold">Siguiente</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit(onSubmit)}
            className="bg-green-500 p-4 flex-1 items-center"
          >
            <Text className="text-white text-center font-semibold">Generar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
