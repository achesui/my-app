import GetProductImage from "@/components/get-product-images";
import { NewInfo } from "@/components/ui/new-info";
import { Control, Controller, FieldErrors, UseFormGetValues } from "react-hook-form";
import { Text, View } from "react-native";

type FirstStepProps = {
    control: Control<CreateDesignFormType>;
    errors: FieldErrors<CreateDesignFormType>;
    getValues: UseFormGetValues<CreateDesignFormType>;
};

// Accept props as a single object
export function FirstStep({ control, errors, getValues }: FirstStepProps) {
    return (
        <View className="px-5">
            <NewInfo>
                <Text
                    className="text-slate-600 text-sm"
                >
                    Elige las fotos de tus productos a los que quieres realizarle el diseño.
                </Text>
            </NewInfo>

            <View className="mt-2">
                {/* Access errors correctly */}
                {errors.images?.message && (
                    <Text className="text-red-500 mb-2">{String(errors.images.message)}</Text>
                )}
                <Controller
                    control={control}
                    name="images"
                    render={({ field: { onChange } }) => (
                        <GetProductImage onImageSelected={onChange} getValues={getValues} />
                    )}
                    rules={{
                        // Adjusted rule: Check if the array is empty or not
                        validate: (value) => value.length > 0 || "Por favor, selecciona al menos una imagen",
                    }}
                />
            </View>
        </View>
    );
}