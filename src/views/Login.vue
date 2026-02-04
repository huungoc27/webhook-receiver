<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">
          {{ isLogin ? 'Sign in' : 'Create account' }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Webhook Receiver - LINE Message API
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Username"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {{ loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Sign up') }}
          </button>
        </div>

        <div class="text-center">
          <button
            type="button"
            @click="isLogin = !isLogin"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {{ isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../utils/api';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const isLogin = ref(true);
    const username = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);

    const handleSubmit = async () => {
      error.value = '';
      loading.value = true;

      try {
        if (isLogin.value) {
          await api.login(username.value, password.value);
        } else {
          await api.register(username.value, password.value);
        }
        router.push('/dashboard');
      } catch (err) {
        error.value = err.response?.data?.error || 'An error occurred';
      } finally {
        loading.value = false;
      }
    };

    return {
      isLogin,
      username,
      password,
      error,
      loading,
      handleSubmit
    };
  }
};
</script>
