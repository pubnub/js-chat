import Toast from "react-native-toast-message"

export async function getAuthKey(userId: string): Promise<{ authKey: string | undefined }> {
  // a local service located in samples/access-manager-api
  try {
    const response = await fetch(`http://localhost:3000/auth-key/${userId}`, {
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
