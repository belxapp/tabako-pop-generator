const sheet = document.getElementById("printSheet")
const colsInput = document.getElementById("cols")
const rowsInput = document.getElementById("rows")
const cardList = document.getElementById("cardList")

let cards = []
let currentIndex = 0

function addCard(){
  cards.push({num:"1",name:"銘柄",tar:"14",price:"600",image:""})
  currentIndex = cards.length - 1
  renderCardEditor()
  renderSheet()
}

function renderTabs(){
  const tabArea = document.createElement("div")
  tabArea.className = "tabs"

  cards.forEach((c,i)=>{
    const btn = document.createElement("button")
    btn.textContent = i+1
    if(i===currentIndex) btn.classList.add("active")
    btn.onclick = ()=>{currentIndex=i;renderCardEditor()}
    tabArea.appendChild(btn)
  })

  const addBtn = document.createElement("button")
  addBtn.textContent = "+"
  addBtn.onclick = addCard

  tabArea.appendChild(addBtn)
  return tabArea
}

function renderCardEditor(){
  cardList.innerHTML = ""
  cardList.appendChild(renderTabs())

  const c = cards[currentIndex]
  if(!c) return

  const div = document.createElement("div")

  div.innerHTML = `
番号
<input value="${c.num}" oninput="cards[${currentIndex}].num=this.value;renderSheet()">

銘柄
<textarea rows="2" oninput="cards[${currentIndex}].name=this.value;renderSheet()">${c.name}</textarea>

タール
<input value="${c.tar}" oninput="cards[${currentIndex}].tar=this.value;renderSheet()">

価格
<input value="${c.price}" oninput="cards[${currentIndex}].price=this.value;renderSheet()">

画像
<input type="file" onchange="loadImage(event,${currentIndex})">
`

  cardList.appendChild(div)
}

function loadImage(e,i){
  const file = e.target.files[0]
  if(!file) return

  const reader = new FileReader()

  reader.onload = ev=>{
    autoCropImage(ev.target.result, (cropped)=>{
      cards[i].image = cropped
      renderSheet()
    })
  }

  reader.readAsDataURL(file)
}

function renderSheet(){
  const cols = parseInt(colsInput.value)
  const rows = parseInt(rowsInput.value)

  sheet.innerHTML = ""
  sheet.style.gridTemplateColumns = `repeat(${cols},53mm)`
  sheet.style.gridTemplateRows = `repeat(${rows},96mm)`

  cards.forEach(c=>{
    sheet.insertAdjacentHTML("beforeend",`
<div class="card">
  <div class="photo"><img src="${c.image}"></div>
  <div class="middle">
    <div class="number">${c.num}</div>
    <div class="name">${c.name}</div>
  </div>
  <div class="footer">${c.tar}mg ¥${c.price}（税込）</div>
</div>
`)
  })
}

function printPOP(){window.print()}

addCard()

// ⭐ 改良版 自動トリミング
function autoCropImage(base64, callback){
  const img = new Image()

  img.onload = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    let top = canvas.height
    let left = canvas.width
    let right = 0
    let bottom = 0

    for(let y = 0; y < canvas.height; y++){
      for(let x = 0; x < canvas.width; x++){
        const i = (y * canvas.width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // ★ここが改善ポイント
        const brightness = (r + g + b) / 3
        const diff = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)

        // 明るくて色差が小さい＝背景（白・グレー）
        if(!(brightness > 200 && diff < 30)){
          if(x < left) left = x
          if(x > right) right = x
          if(y < top) top = y
          if(y > bottom) bottom = y
        }
      }
    }

    // 余白
    const padding = 20
    left = Math.max(0, left - padding)
    top = Math.max(0, top - padding)
    right = Math.min(canvas.width, right + padding)
    bottom = Math.min(canvas.height, bottom + padding)

    const w = right - left
    const h = bottom - top

    const cropCanvas = document.createElement("canvas")
    const cropCtx = cropCanvas.getContext("2d")

    cropCanvas.width = w
    cropCanvas.height = h

    cropCtx.drawImage(canvas, left, top, w, h, 0, 0, w, h)

    callback(cropCanvas.toDataURL())
  }

  img.src = base64
}
