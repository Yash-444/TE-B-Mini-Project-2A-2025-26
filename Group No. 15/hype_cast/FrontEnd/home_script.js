window.addEventListener("scroll", function () {
  const roleSection = document.getElementById("roleSection");
  const roleButtons = document.getElementById("roleButtons");

  const sectionTop = roleSection.getBoundingClientRect().top;

  if (sectionTop <= window.innerHeight * 0.5) {
    roleButtons.classList.add("visible");
  } else {
    roleButtons.classList.remove("visible");
  }
});
