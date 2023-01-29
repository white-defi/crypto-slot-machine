(() => {

  // html elements
  let can     // canvas
  let ctx     // context


  const assets = {
    images: {
      symbol_0: `images/symbols/apple.png`,
      symbol_1: `images/symbols/bar.png`,
      symbol_2: `images/symbols/bell.png`,
      symbol_3: `images/symbols/cherry.png`,
      symbol_4: `images/symbols/lemon.png`,
      symbol_5: `images/symbols/orange.png`,
      symbol_6: `images/symbols/plum.png`,
      symbol_7: `images/symbols/seven.png`,
      symbol_8: `images/symbols/water-melon.png`,
      reels_bg: `images/reels_bg.png`
    },
    sounds: {
      win: `sounds/win.wav`,
      reel_stop: `sounds/reel_stop.wav`
    }
  }
  const assets_sounds = {}
  const assets_backbuffers = {}
  const assets_loaded = {
    images: {},
    sounds: {}
  }

  const assetsIsLoaded = () => {
    const imagesLoaded = Object.keys(assets.images).length == Object.keys(assets_loaded.images).length
    const soundsLoaded = Object.keys(assets.sounds).length == Object.keys(assets_loaded.sounds).length
    return imagesLoaded
  }

  const preloadAssets = (onLoad) => {
    Object.keys(assets.images).forEach((assetKey) => {
      const _backbuffer = new Image()
      assets_backbuffers[assetKey] = _backbuffer
      _backbuffer.src = assets.images[assetKey]
      _backbuffer.onload = () => {
        assets_loaded.images[assetKey] = true
        console.log(`Image asset loaded (${Object.keys(assets_loaded.images).length} / ${Object.keys(assets.images).length}): ${assetKey} [${assets.images[assetKey]}]`)
        if (onLoad) onLoad()
      }
    })
    Object.keys(assets.sounds).forEach((assetKey) =>{
      const _sound = new Audio(assets.sounds[assetKey])
      assets_sounds[assetKey] = _sound
      _sound.addEventListener('canplaythrough', () => {
        assets_loaded.sounds[assetKey] = true
        console.log(`Sound asset loaded (${Object.keys(assets_loaded.sounds).length} / ${Object.keys(assets.sounds).length}): ${assetKey} [${assets.sounds[assetKey]}]`)
      }, false)
    })
  }


  let reelBuffer = null

  // enums
  const STATE_REST = 0
  const STATE_SPINUP = 1
  const STATE_SPINDOWN = 2
  const STATE_REWARD = 3

  // config
  const reel_area_left = 0
  const reel_area_top = 0
  const reel_area_width = 320
  const reel_area_height = 192
  const reel_count = 5
  const reel_positions = 27
  const symbol_size = 64
  const symbol_count = 9
  const reel_pixel_length = 9 * 4 * symbol_size

  const reelHeight = reel_positions * symbol_size
  const reelScrollHeight = 9 * symbol_size * 2
  const reelStopMaxOffset = reel_positions * symbol_size * 3;
  const row_count = 3;
  const stopping_distance = reel_positions * symbol_size;
  const max_reel_speed = 32;
  const spinup_acceleration = 1;
  const spindown_acceleration = 0.1;
  const minSpinSpeed = 10;

  const reelsTemplate = [0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8]
  const reels = [ reelsTemplate, reelsTemplate, reelsTemplate, reelsTemplate, reelsTemplate ]

  const winLines = [
      [1, 1, 1, 1, 1],    // 0
      [0, 0, 0, 0, 0],    // 1
      [2, 2, 2, 2, 2],    // 2

      [1, 1, 0, 1, 2],    // 3
      [1, 1, 2, 1, 0],    // 4
      [1, 0, 1, 2, 1],    // 5
      [1, 0, 1, 2, 2],    // 6
      [1, 0, 0, 1, 2],    // 7
      [1, 2, 1, 0, 1],    // 8
      [1, 2, 2, 1, 0],    // 9
      [1, 2, 1, 0, 0],    // 10

      [0, 1, 2, 1, 0],    // 11
      [0, 1, 1, 1, 2],    // 12
      [0, 0, 1, 2, 2],    // 13
      [0, 0, 1, 2, 1],    // 14
      [0, 0, 0, 1, 2],    // 15

      [2, 1, 0, 1, 2],    // 16
      [2, 1, 1, 1, 0],    // 17
      [2, 2, 1, 0, 0],    // 18
      [2, 2, 1, 0, 1]     // 19
  ];

  const reel_position = [0, 0, 0, 0, 0]
  const stopping_position = [0, 0, 0, 0, 0]
  const start_slowing = [false, false, false, false, false]
  const reel_speed = [0, 0, 0, 0, 0]


  let game_state = STATE_REST


  //---- Render Functions ---------------------------------------------
  let fps
  let maxFps = 0
  let requestTime



  const draw_symbol = (symbol_index, x, y) => {
    var symbol_pixel = symbol_index * symbol_size
    ctx.drawImage(reelBuffer,
      0, symbol_pixel,
      symbol_size, symbol_size,
      x + reel_area_left, y + reel_area_top,
      symbol_size, symbol_size
    )
  }

  const render_winLine = (lineIndex, color) => {
    ctx.beginPath();
    const oX = reel_area_left
    const oY = reel_area_top
    const sH = symbol_size / 2
    const sW = symbol_size
    
    ctx.moveTo(oX, oY + winLines[lineIndex][0] * sW + sH)
    ctx.lineTo(oX + sH, oY + winLines[lineIndex][0] * sW + sH)
    for (let reel = 1; reel < 5; reel++ ) {
      ctx.lineTo(oX + sH + reel * sW, oY + winLines[lineIndex][reel] * sW + sH)
    }
    ctx.lineTo(oX + 5 * sW + sW, oY + winLines[lineIndex][4] * sW + sH)
    ctx.lineWidth = 10;
    ctx.strokeStyle = color || '#84c702d9'
    ctx.stroke()
  }

  const render_reel = () => {
    ctx.drawImage(
      assets_backbuffers.reels_bg,
      0,
      0,
      assets_backbuffers.reels_bg.width,
      assets_backbuffers.reels_bg.height,
      reel_area_left,
      reel_area_top,
      reel_area_width,
      reel_area_height
    )
    
    ctx.beginPath()
    ctx.rect(reel_area_left, reel_area_top, reel_area_width, reel_area_height)
    ctx.clip()

    let reel_index
    let symbol_offset
    let symbol_index
    let x
    let y

    for (let i=0; i<reel_count; i++) {
      for (let j=0; j<row_count +1; j++) {

        reel_index = Math.floor(reel_position[i] / symbol_size) + j
        symbol_offset = reel_position[i] % symbol_size;
   
        if (reel_index >= reel_positions) reel_index -= reel_positions
        symbol_index = reels[i][reel_index]

        x = i * symbol_size
        y = j * symbol_size - symbol_offset

        draw_symbol(symbol_index, x, y)

      }
    }
  }


  const mainLoop = async (time) => {
    if (requestTime) {
      fps = Math.round(1000/((performance.now() - requestTime)))
    }
    logic()
    if (game_state == STATE_SPINUP || game_state == STATE_SPINDOWN) {
      render_reel()
    }
    requestTime = time
    if (fps > maxFps) maxFps = fps
    window.requestAnimationFrame((timeRes) => mainLoop(timeRes))
  }

  window.requestAnimationFrame((timeRes) => mainLoop(timeRes))


  //---- Logic Functions ---------------------------------------------

  let _spinResult = [
    [0,1,2,3,4],
    [1,2,3,4,5],
    [2,3,4,5,6]
  ]

  const delay = (ms) => {
    return new Promise((resolve) => {
      setTimeout(() => { resolve() }, ms)
    })
  }

  let onStop = () => {}
  const stop = (spinResult, _onStopAll) => {
    onStop = _onStopAll
    for (var i=0; i<reel_count; i++) {
      start_slowing[i] = false
      stop_index =  spinResult[0][i] * symbol_size
      stopping_position[i] = stop_index + 9 * symbol_size
    }
    game_state = STATE_SPINDOWN
  }

  const move_reel = (i) => {
    reel_position[i] -= reel_speed[i] * (fps / maxFps)
    if (reel_position[i] < 0) {
      reel_position[i] += reel_pixel_length
    }
  }

  const logic_spinup = () => {
    for (let i=0; i<reel_count; i++) {
      move_reel(i)
      if (reel_speed[0] < max_reel_speed) {
        reel_speed[i] += spinup_acceleration * (i+1) * (fps / maxFps)
        if (reel_speed[i] > max_reel_speed) reel_speed[i] = max_reel_speed
      }
    }

  }

  const logic_spindown = () => {
    if (reel_speed[reel_count-1] == 0) {
      game_state = STATE_REWARD;
    }
    for (let i=0; i<reel_count; i++) {
      move_reel(i)
      if (start_slowing[i] == false) {
        let check_position = false
        if (i == 0) check_position = true
        else if (start_slowing[i-1]) check_position = true

        if (check_position) {
          if ((reel_position[i] > stopping_position[i]) && (i == 0 || reel_speed[i-1] ==0)) {
            start_slowing[i] = true
          }
        }
      }
      else {
        if (reel_speed[i] > 0) {
          reel_speed[i] -= spindown_acceleration * (fps/maxFps)
          if (reel_speed[i] < minSpinSpeed) reel_speed[i] = minSpinSpeed * (fps/maxFps)
            
          if (parseInt(reel_position[i]) <= parseInt(stopping_position[i])) {
            reel_position[i] = stopping_position[i]
            reel_speed[i] = 0
            if (i == 4) onStop()
            try {
              assets_sounds.reel_stop.currentTime = 0
              assets_sounds.reel_stop.play()
            } catch(err) {
              console.log('err', err)
            }
          }
        }
      }
    }
  }

  const logic_reward = () => {
    game_state = STATE_REST
  }
  
  const logic = () => {
    if (game_state == STATE_SPINUP) {
      logic_spinup()
    }
    else if (game_state == STATE_SPINDOWN) {
      logic_spindown()
    }
    else if (game_state == STATE_REWARD) {
      logic_reward()
    }
  }

  const spin = () => {
    if (game_state != STATE_REST) return
    game_state = STATE_SPINUP;
  }

  //---- Init Functions -----------------------------------------------

  const prepareReel = () => {
    const buffer = document.createElement('CANVAS')
    const bufferWidth = symbol_size
    const bufferHeight = symbol_size * 9 * 2
    buffer.width = bufferWidth
    buffer.height = bufferHeight
    const bCtx = buffer.getContext('2d')
    bCtx.beginPath();
    
    bCtx.clearRect(0, 0, symbol_size, symbol_size * 9 * 2);
    bCtx.rect(0, 0, symbol_size, symbol_size * 9 * 2)
    bCtx.clip()
    bCtx.clearRect(0, 0, symbol_size, symbol_size * 9 * 2)
    for (let symbolIndex = 0; symbolIndex < 9; symbolIndex++) {
      bCtx.drawImage(
        assets_backbuffers[`symbol_${symbolIndex}`],
        0, 0,
        assets_backbuffers[`symbol_${symbolIndex}`].width,
        assets_backbuffers[`symbol_${symbolIndex}`].height,
        0, symbol_size * symbolIndex,
        symbol_size, symbol_size
      );
    }
    bCtx.drawImage(buffer, 0, symbol_size * 9)
    reelBuffer = buffer
  }

  const init = (canvasId) => {
    can = document.getElementById(canvasId)
    can.width = reel_area_width
    can.height = reel_area_height
    ctx = can.getContext("2d")


    preloadAssets(() => {
      if (assetsIsLoaded()) {
        prepareReel()
        render_reel()
      }
    })

  }

  window.SLOT_MACHINE = {
    init,
    spin,
    stop,
    render_winLine,
    render_reel
  }
})()

