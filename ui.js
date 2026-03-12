// UI interactions

const buttons = document.querySelectorAll("button")

buttons.forEach(btn => {

  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "scale(1.1)"
  })

  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "scale(1)"
  })

})
