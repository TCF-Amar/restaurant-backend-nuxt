<template>
    <div>
        <p>hello world</p>
        <CompOne />
        <CompTwo />

    </div>
</template>

<script setup>
const config = useRuntimeConfig()

console.log(config)



</script>

<style scoped></style>