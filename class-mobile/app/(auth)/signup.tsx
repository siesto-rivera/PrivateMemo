import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (submitting) return;
    setError(null);
    if (!email.trim() || !name.trim() || !password) {
      setError('모든 필드를 입력해주세요');
      return;
    }
    setSubmitting(true);
    try {
      await signup(email.trim(), name.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원가입에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          <Text className="text-3xl font-bold text-gray-900 mb-1">회원가입</Text>
          <Text className="text-sm text-gray-500 mb-8">지극히 사적인 메모장</Text>

          <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">이메일</Text>
          <View className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100">
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              className="text-[15px] text-gray-900"
            />
          </View>

          <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">이름</Text>
          <View className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="홍길동"
              placeholderTextColor="#9ca3af"
              className="text-[15px] text-gray-900"
            />
          </View>

          <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">비밀번호</Text>
          <View className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100">
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              className="text-[15px] text-gray-900"
            />
          </View>

          {error ? (
            <Text className="text-sm text-red-500 mb-3 ml-1">{error}</Text>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            className="bg-brand-500 rounded-2xl py-4 items-center active:bg-brand-600 disabled:opacity-50"
          >
            <Text className="text-white text-base font-semibold">
              {submitting ? '가입 중…' : '회원가입'}
            </Text>
          </Pressable>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-gray-500">이미 계정이 있나요? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm text-brand-600 font-semibold">로그인</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
