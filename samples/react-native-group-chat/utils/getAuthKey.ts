import Toast from "react-native-toast-message"
import { Platform } from "react-native"

export async function getAuthKey(userId: string): Promise<{ authKey: string | undefined }> {
  // a local service located in samples/access-manager-api
  const origin = Platform.OS === "android" ? "10.0.2.2" : "localhost"

  try {
    const response = await fetch(`http://${origin}:3000/auth-key/${userId}`, {
      method: "GET",
    })

    const json = await response.json()
    Toast.show({
      type: "success",
      text1: "AuthKey refreshed",
    })

    return json
  } catch (error) {
    console.log("Failed to obtain the auth token", error.message)
  }

  return {
    authKey: undefined,
  }
}
