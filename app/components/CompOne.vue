<template>
    <div class="flex justify-center items-center gap-4">
        <button @click="countone--" class="px-2 py-1 border rounded">-</button>
        <p class="px-2 py-1 border rounded">{{ countone }}</p>
        <button @click="countone++" class="px-2 py-1 border rounded">+</button>
    </div>
</template>

<script setup>

const countone = useState("count", () => 100)

</script>

<style scoped></style>