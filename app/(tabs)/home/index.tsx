import { useSession } from "@/components/auth-ctx";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  const { signOut } = useSession();
  return (
    <View>
      <Text>Hola..</Text>
      <Pressable onPress={signOut}>
        <Text>Salir</Text>
      </Pressable>
    </View>
  );
}
