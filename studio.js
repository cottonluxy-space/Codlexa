const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
1000
)

camera.position.z = 5

const renderer = new THREE.WebGLRenderer({
canvas:document.getElementById("webgl"),
antialias:true
})

renderer.setSize(window.innerWidth,window.innerHeight)

const geometry = new THREE.IcosahedronGeometry(2,1)

const material = new THREE.MeshNormalMaterial({
wireframe:true
})

const mesh = new THREE.Mesh(
geometry,
material
)

scene.add(mesh)

function animate(){

requestAnimationFrame(animate)

mesh.rotation.x +=0.01
mesh.rotation.y +=0.01

renderer.render(scene,camera)

}

animate()
