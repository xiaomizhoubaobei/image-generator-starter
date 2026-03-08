import { Client } from "@gradio/client";

const client = await Client.connect("Tongyi-MAI/Z-Image-Turbo");
const result = await client.predict("/generate", {
    prompt: "Hello!!",

    resolution: "1024x1024 ( 1:1 )",

    seed: 42,

    steps: 8,

    shift: 3,

    random_seed: true,

    gallery_images: [],

});

console.log(JSON.stringify(result.data, null, 2));