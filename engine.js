const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
1000
)

camera.position.z = 8


const renderer = new THREE.WebGLRenderer({
canvas:document.getElementById("webgl"),
antialias:true
})

renderer.setSize(window.innerWidth,window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)


/* PARTICLE GALAXY */

const particleCount = 15000

const geometry = new THREE.BufferGeometry()

const positions = new Float32Array(particleCount * 3)

for(let i=0;i<particleCount*3;i++){

positions[i]=(Math.random()-0.5)*50

}

geometry.setAttribute(
"position",
new THREE.BufferAttribute(positions,3)
)


const material = new THREE.PointsMaterial({
size:0.03
})

const particles = new THREE.Points(
geometry,
material
)

scene.add(particles)



/* HOLOGRAM TORUS */

const holoGeometry = new THREE.TorusKnotGeometry(2,0.4,120,16)

const holoMaterial = new THREE.MeshStandardMaterial({
wireframe:true
})

const hologram = new THREE.Mesh(
holoGeometry,
holoMaterial
)

scene.add(hologram)



/* LIGHTS */

const light = new THREE.PointLight(0xffffff,2)

light.position.set(5,5,5)

scene.add(light)



/* BLOOM EFFECT */

const composer = new THREE.EffectComposer(renderer)

const renderPass = new THREE.RenderPass(scene,camera)

composer.addPass(renderPass)

const bloom = new THREE.UnrealBloomPass(
new THREE.Vector2(window.innerWidth,window.innerHeight),
1.5,
1,
0.1
)

composer.addPass(bloom)



/* ANIMATION LOOP */

function animate(){

requestAnimationFrame(animate)

particles.rotation.y +=0.0004
particles.rotation.x +=0.0002

hologram.rotation.x +=0.01
hologram.rotation.y +=0.01

composer.render()

}

animate()



/* RESIZE */

window.addEventListener("resize",()=>{

camera.aspect=window.innerWidth/window.innerHeight
camera.updateProjectionMatrix()

renderer.setSize(window.innerWidth,window.innerHeight)

})
