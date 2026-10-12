<template>
    <div class="flex justify-center items-center gap-4">
        <button @click="add" class="px-2 py-1 border rounded">+10</button>
        <p class="px-2 py-1 border rounded">{{ counttwo }}</p>
        <button @click="sub" class="px-2 py-1 border rounded">-10</button>
    </div>
</template>

<script setup>

const counttwo = useState("count")

const add = () => {
    counttwo.value = counttwo.value + 10
}

const sub = () => {
    counttwo.value = counttwo.value - 10
}

</script>

<style scoped></style>