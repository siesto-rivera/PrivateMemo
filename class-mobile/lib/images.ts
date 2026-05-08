import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';


/**
 * Pick an image from the user's photo library.
 * Returns the asset ID (PhotoKit/MediaStore ID), or null if cancelled.
 */
export async function pickFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('사진 라이브러리 접근 권한이 필요합니다');
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });
  if (res.canceled) return null;
  const asset = res.assets[0];
  // expo-image-picker returns the underlying assetId for items chosen from the library.
  if (asset.assetId) return asset.assetId;
  // Fallback: save the URI to library to obtain an asset ID.
  return saveUriToLibrary(asset.uri);
}


/**
 * Take a photo with the camera and save it to the user's photo album.
 * Returns the new asset ID, or null if cancelled.
 */
export async function pickFromCamera(): Promise<string | null> {
  const camPerm = await ImagePicker.requestCameraPermissionsAsync();
  if (!camPerm.granted) {
    Alert.alert('카메라 권한이 필요합니다');
    return null;
  }
  const libPerm = await MediaLibrary.requestPermissionsAsync();
  if (!libPerm.granted) {
    Alert.alert('사진 앱에 저장하려면 권한이 필요합니다');
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });
  if (res.canceled) return null;
  return saveUriToLibrary(res.assets[0].uri);
}


async function saveUriToLibrary(uri: string): Promise<string | null> {
  try {
    const asset = await MediaLibrary.createAssetAsync(uri);
    return asset.id;
  } catch (e) {
    console.warn('saveUriToLibrary failed', e);
    return null;
  }
}


/**
 * Resolve an asset ID to a renderable URI. Returns null if the asset is no longer
 * in the library (e.g. user deleted the photo) or permission is missing.
 */
export async function getImageUri(assetId: string): Promise<string | null> {
  try {
    const perm = await MediaLibrary.getPermissionsAsync();
    if (!perm.granted) {
      const next = await MediaLibrary.requestPermissionsAsync();
      if (!next.granted) return null;
    }
    const info = await MediaLibrary.getAssetInfoAsync(assetId);
    return info?.localUri ?? info?.uri ?? null;
  } catch {
    return null;
  }
}
