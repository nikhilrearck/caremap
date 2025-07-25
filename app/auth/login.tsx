import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import {
  getGoogleAuthRequest,
  handleGoogleSignIn,
} from "@/services/auth-service/google-auth";
import palette from "@/utils/theme/color";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [request, response, promptAsync] = getGoogleAuthRequest();

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response, async (accessToken: string) => {
        const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.json();
      });
    }
  }, [response]);

  return (
    <LinearGradient
      colors={[palette.gradientStart, palette.gradientEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 justify-center px-6 ">
        <Image
          source={require("@/assets/images/careMap-logo.png")}
          style={{ width: 120, height: 60, marginBottom: 30 }}
          resizeMode="contain"
        />

        <Image
          source={require("../../assets/images/intro4.png")}
          className="w-[400px] h-[300px] rounded-lg"
          resizeMode="contain"
        />

        <Text
          style={{ color: palette.primary }}
          className="text-[30px]  font-bold text-left py-4 "
        >
          Welcome
        </Text>

        <Text className="text-left text-base py-4 ">
          Teams of family members, doctors, nurses, and case managers work
          together to care for children with complex medical issues.
        </Text>

        <View className="flex items-left  py-4">
          <Button
            variant="solid"
            action="secondary"
            className="bg-white border border-gray-300 w-full rounded-sm my-2 h-14"
            size="md"
          >
            <View className="flex-row items-center px-4 w-full">
              <Image
                source={require("@/assets/images/apple-logo.png")}
                className="w-6 h-6 mr-3"
                resizeMode="contain"
              />
              <ButtonText className="text-lg text-black text-left flex-1">
                Continue with Apple
              </ButtonText>
            </View>
          </Button>

          <Button
            variant="solid"
            action="secondary"
            className="bg-white border border-gray-300 w-full rounded-sm my-4 h-14"
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <View className="flex-row items-center px-4 w-full">
              <Image
                source={require("@/assets/images/google-logo.png")}
                className="w-6 h-6 mr-3"
                resizeMode="contain"
              />
              <ButtonText className="text-lg text-black text-left flex-1">
                Continue with Google
              </ButtonText>
            </View>
          </Button>

          <View className="flex-row justify-center items-center mt-10">
            <Text style={{ color: palette.primary }}>Terms of Use</Text>
            <Divider
              style={{ backgroundColor: palette.primary }}
              orientation="vertical"
              className="mx-2 h-[16px] "
            />
            <Text style={{ color: palette.primary }}>Privacy Policy</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
