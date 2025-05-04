import { NewInfo } from "@/components/ui/new-info";
import { Control, Controller, FieldErrors, UseFormGetValues } from "react-hook-form";
import { Image, Text, TextInput, View } from "react-native";
import { CompletedStepsFeedback } from "./steps-feedback";

type SecondStepProps = {
    control: Control<CreateDesignFormType>;
    errors: FieldErrors<CreateDesignFormType>;
    getValues: UseFormGetValues<CreateDesignFormType>;
}

export function SecondStep ({ control, errors, getValues }: SecondStepProps)  {
    return (
        <View className="px-5 gap-2">
            <View className="">
                <CompletedStepsFeedback title={getValues("images").length > 1
                    ? "Se usaran estas fotos para generar el diseño"
                    : "Se usara esta foto para generar el diseño"}>
                    <View className="flex-row gap-2">
                        {getValues("images").map((image, index) => (
                            <Image
                                key={index}
                                source={{ uri: image.uri }}
                                className="w-10 h-10 rounded"
                            />
                        ))}
                    </View>
                </CompletedStepsFeedback>
            </View>

            <NewInfo>
                <Text
                    className="text-slate-600 text-sm"
                >
                    2. Agrega el texto que quieres que aparezca en el diseño.
                </Text>
            </NewInfo>

            <View>
                {errors.designText?.message && (
                    <Text className="text-red-500 mb-2">{String(errors.designText.message)}</Text>
                )}
                <Controller
                    control={control}
                    name="designText"
                    render={({ field: { onBlur, value, onChange } }) => (
                        <TextInput
                            className="border border-gray-300 rounded px-3 py-2 text-base bg-white mb-4 w-full min-h-[80px]"
                            placeholder="Agrega detalles adicionales..."
                            onBlur={onBlur}
                            value={value}
                            onChangeText={onChange}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    )}
                    rules={{
                        required: "Por favor, agrega detalles adicionales",
                        maxLength: {
                            value: 200,
                            message: "No puede exceder 200 caracteres",
                        },
                    }}
                />
            </View>
        </View>
    );
};