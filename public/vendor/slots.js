(() => {
  // html elements
  let can     // canvas
  let ctx     // context

  const debugBuffers = false

  let isFixedCanvas = false
  
  let assets = {
    images: {
      symbol_0: `_MYAPP/vendor/images/symbols/apple.png`,
      symbol_1: `_MYAPP/vendor/images/symbols/bar.png`,
      symbol_2: `_MYAPP/vendor/images/symbols/bell.png`,
      symbol_3: `_MYAPP/vendor/images/symbols/cherry.png`,
      symbol_4: `_MYAPP/vendor/images/symbols/lemon.png`,
      symbol_5: `_MYAPP/vendor/images/symbols/orange.png`,
      symbol_6: `_MYAPP/vendor/images/symbols/plum.png`,
      symbol_7: `_MYAPP/vendor/images/symbols/seven.png`,
      symbol_8: `_MYAPP/vendor/images/symbols/water-melon.png`,
      reel_bg: `_MYAPP/vendor/images/reel_bg.png`,
      win_animation: `_MYAPP/vendor/images/animation.png`,
    },
    sounds: {
      win: `_MYAPP/vendor/sounds/win.wav`,
      reel_stop: `_MYAPP/vendor/sounds/reel_stop.wav`
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

  let mainBackBuffer = null
  let backbuffer = null
  let bgBuffer = null
  let waBuffer = null
  let reelBuffer = null

  // enums
  const STATE_REST = 0
  const STATE_SPINUP = 1
  const STATE_SPINDOWN = 2
  const STATE_REWARD = 3

  // config
  const reel_area_left = 0
  const reel_area_top = 0
  let slotSize = 64
  const reel_count = 5
  const row_count = 3;
  let reel_area_width = slotSize * reel_count
  let reel_area_height = slotSize * row_count
  
  const reel_positions = 27
  
  const symbol_count = 9

  let reel_pixel_length = 9 * 4 * slotSize

  let reelHeight = reel_positions * slotSize
  let reelScrollHeight = 9 * slotSize * 2
  let reelStopMaxOffset = reel_positions * slotSize * 3;
  
  let stopping_distance = reel_positions * slotSize;

  let reel_position = [0 * slotSize, 1 * slotSize, 6 * slotSize, 8 * slotSize, 5 * slotSize]
  
  const max_reel_speed = 128;
  const spinup_acceleration = 1;
  const spindown_acceleration = 0.1;
  const minSpinSpeed = 10;

  const recalcRenderValues = () => {
    reel_area_width = slotSize * reel_count
    reel_area_height = slotSize * row_count
    reel_pixel_length = 9 * 4 * slotSize
    reelHeight = reel_positions * slotSize
    reelScrollHeight = 9 * slotSize * 2
    reelStopMaxOffset = reel_positions * slotSize * 3;
    stopping_distance = reel_positions * slotSize;
    reel_position = [0 * slotSize, 1 * slotSize, 6 * slotSize, 8 * slotSize, 5 * slotSize]
  }

  const reelsTemplate = [0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8]
  const reels = [ reelsTemplate, reelsTemplate, reelsTemplate, reelsTemplate, reelsTemplate ]

  let lineColors = [
    '#9907077a',
    '#079985a3',
    '#990795a3',
    '#179907a3',
    '#418dff',
    '#a855f7',
    '#7d55f7ab',
    '#f5f755ab',
    '#f78955e0',
    '#55f7d9e0',
    '#9907077a',
    '#079985a3',
    '#990795a3',
    '#179907a3',
    '#418dff',
    '#a855f7',
    '#7d55f7ab',
    '#f5f755ab',
    '#f78955e0',
    '#55f7d9e0',
  ]
  let winLines = [
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
  let slotMult = [
      /* 0 apple  */ [ 0, 0, 20,   80,    200],
      /* 1 bar    */ [ 0, 0, 40,   400,   2000],
      /* 2 bell   */ [ 0, 8, 15,   120,   500],
      /* 3 cherry */ [ 0, 2, 8,    20,    80],
      /* 4 lemon  */ [ 0, 0, 8,    20,    80],
      /* 5 orange */ [ 0, 0, 20,   80,    200],
      /* 6 plum   */ [ 0, 0, 8,    20,    80],
      /* 7 seven  */ [ 0, 0, 20,   200,   1000],
      /* 8 wmelon */ [ 0, 0, 2,    5,     15]
  ];

  
  const stopping_position = [0, 0, 0, 0, 0]
  const start_slowing = [false, false, false, false, false]
  const reel_speed = [0, 0, 0, 0, 0]


  let game_state = STATE_REST


  //---- Render Functions ---------------------------------------------
  let fps
  let maxFps = 0
  let requestTime

  let activeWinLine = -1
  let previewWinLine = 0

  let winAnimationFrame = 0
  let winAnimationFrameCount = 14
  let winAnimationFrameRate = 100
  let winCombination = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ]
  const hideWinAnimation = () => {
    winCombination = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ]
  }
  
  const animationProcess = () => {
    winAnimationFrame = (winAnimationFrame == winAnimationFrameCount -1) ? 0 : winAnimationFrame + 1
    window.setTimeout(animationProcess, winAnimationFrameRate)
  }
  window.setTimeout(animationProcess, winAnimationFrameRate)
  const render_winAnimation = () => {
    const oX = reel_area_left
    const oY = reel_area_top

    //console.log(a)
    for (let reelRow = 0; reelRow < 3; reelRow++) {
      for (let reelCol = 0; reelCol < 5; reelCol++) {
        if (winCombination[reelRow][reelCol]) {
          backbuffer.drawImage(
            waBuffer,
            winAnimationFrame * slotSize,
            0,
            slotSize, slotSize,
            oX + reelCol * slotSize,
            oY + reelRow * slotSize,
            slotSize,
            slotSize
          )
        }
      }
    }
    
  }

  const prepareWinAnimation = () => {
    const bufferHeight = slotSize
    const bufferWidth = slotSize * winAnimationFrameCount
    const buffer = createBuffer(bufferWidth, bufferHeight)
    const bCtx = buffer.getContext('2d')
    bCtx.drawImage(
      assets_backbuffers.win_animation,
      0, 0,
      assets_backbuffers.win_animation.width,
      assets_backbuffers.win_animation.height,
      0, 0,
      bufferWidth,
      bufferHeight
    )
    waBuffer = buffer
  }

  const prepareMainBackBuffer = () => {
    const bufferWidth = reel_area_left + slotSize * reel_count
    const bufferHeight = reel_area_top +  slotSize * row_count
    mainBackBuffer = createBuffer(bufferWidth, bufferHeight)
    backbuffer = mainBackBuffer.getContext('2d')
  }

  const draw_symbol = (symbol_index, x, y) => {
    if (!reelBuffer) return
    var symbol_pixel = symbol_index * slotSize
    backbuffer.drawImage(reelBuffer,
      0, symbol_pixel,
      slotSize, slotSize,
      x + reel_area_left, y + reel_area_top,
      slotSize, slotSize
    )
  }

  const render_winLine = (lineIndex, color) => {
    backbuffer.beginPath();
    const oX = reel_area_left
    const oY = reel_area_top
    const sH = slotSize / 2
    const sW = slotSize
    
    backbuffer.moveTo(oX, oY + winLines[lineIndex][0] * sW + sH)
    backbuffer.lineTo(oX + sH, oY + winLines[lineIndex][0] * sW + sH)
    for (let reel = 1; reel < 5; reel++ ) {
      backbuffer.lineTo(oX + sH + reel * sW, oY + winLines[lineIndex][reel] * sW + sH)
    }
    backbuffer.lineTo(oX + 5 * sW + sW, oY + winLines[lineIndex][4] * sW + sH)
    backbuffer.lineWidth = 10;
    backbuffer.strokeStyle = color || '#84c702d9'
    backbuffer.stroke()
  }

  const render_reel = () => {
    backbuffer.drawImage(
      bgBuffer,
      reel_area_left,
      reel_area_top
    )
    
    backbuffer.beginPath()
    backbuffer.rect(reel_area_left, reel_area_top, reel_area_width, reel_area_height)
    backbuffer.clip()

    render_winAnimation()

    let reel_index
    let symbol_offset
    let symbol_index
    let x
    let y

    for (let i=0; i<reel_count; i++) {
      for (let j=0; j<row_count +1; j++) {

        reel_index = Math.floor(reel_position[i] / slotSize) + j
        symbol_offset = reel_position[i] % slotSize;
   
        if (reel_index >= reel_positions) reel_index -= reel_positions
        symbol_index = reels[i][reel_index]

        x = i * slotSize
        y = j * slotSize - symbol_offset

        draw_symbol(symbol_index, x, y)

      }
    }
    if (activeWinLine != -1) {
      render_winLine(activeWinLine, lineColors[activeWinLine])
    }
    for (let line = 0; line < previewWinLine; line++) {
      render_winLine(line, lineColors[line])
    }
  }


  const mainLoop = async (time) => {
    if (!_isInited) return
    if (requestTime) {
      fps = Math.round(1000/((performance.now() - requestTime)))
    }
    logic()

    render_reel()
    // Copy back buffer to main canvas
    const sW = mainBackBuffer.width
    const sH = mainBackBuffer.height
    const dW = can.width
    const dH = (sH * dW) / sW

    ctx.drawImage(
      mainBackBuffer,
      0, 0,
      sW, sH,
      0, 0,
      dW, dH
    )

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

  const _wildSlot = 1
  const slotUp = (v) => { return v == 0 ? 8 : v - 1 }
  const slotDw = (v) => { return v == 8 ? 0 : v + 1 }
  const markWinSlots = (winLine, wSlots) => {
    const slots = [
      [slotUp(wSlots[0]), slotUp(wSlots[1]), slotUp(wSlots[2]), slotUp(wSlots[3]), slotUp(wSlots[4])],
      wSlots,
      [slotDw(wSlots[0]), slotDw(wSlots[1]), slotDw(wSlots[2]), slotDw(wSlots[3]), slotDw(wSlots[4])]
    ]
    winCombination = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ]
    let matchCount = 0;
    let startNotWildReel = 0;
    let firstSlot;

    // Ищем первый не wild (bar) слот

    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
      if (slots[winLines[winLine][reelIndex]][reelIndex] != _wildSlot) {
        startNotWildReel = reelIndex;
        winCombination[winLines[winLine][reelIndex]][reelIndex] = 1
        break;
      } else {
        matchCount++;
        winCombination[winLines[winLine][reelIndex]][reelIndex] = 1
      }
    }

    if (matchCount > 0 && slotMult[_wildSlot][matchCount - 1] > 0) {
        // bars - wild check
       return winCombination
    } else {
      firstSlot = slots[winLines[winLine][startNotWildReel]][startNotWildReel];
      for (let reelIndex = startNotWildReel + 1; reelIndex < 5; reelIndex++) {
        if (
            (slots[winLines[winLine][reelIndex]][reelIndex] == firstSlot)
            || 
            (slots[winLines[winLine][reelIndex]][reelIndex] == _wildSlot)
        ) {
          matchCount++;
          winCombination[winLines[winLine][reelIndex]][reelIndex] = 1
        } else {
          break;
        }
      }
      if (matchCount>0) {
        return winCombination
      }
    }
    return winCombination
  }
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
      stop_index =  spinResult[0][i] * slotSize
      stopping_position[i] = stop_index + 9 * slotSize
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
      game_state = STATE_REWARD
      onStop()
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
  const createBuffer = (bufferWidth, bufferHeight) => {
    const buffer = document.createElement('CANVAS')
    buffer.width = bufferWidth
    buffer.height = bufferHeight
    if (debugBuffers) document.body.appendChild(buffer)
    const bCtx = buffer.getContext('2d')
    bCtx.clearRect(0, 0, bufferWidth, bufferHeight);
    bCtx.beginPath();
    bCtx.rect(0, 0, bufferWidth, bufferHeight)
    bCtx.clip()
    return buffer
  }
  
  const prepareBg = () => {
    const bufferWidth = reel_area_width
    const bufferHeight = reel_area_height
    const buffer = createBuffer(bufferWidth, bufferHeight)

    const bCtx = buffer.getContext('2d')
    
    for (let reelIndex = 0; reelIndex < reel_count; reelIndex++) {
      bCtx.drawImage(
        assets_backbuffers.reel_bg,
        0, 0,
        assets_backbuffers.reel_bg.width,
        assets_backbuffers.reel_bg.height,
        reelIndex * slotSize, 0,
        slotSize, bufferHeight
      )
    }
    /*
    bCtx.drawImage(
      assets_backbuffers.reels_bg,
      0,
      0,
      assets_backbuffers.reels_bg.width,
      assets_backbuffers.reels_bg.height,
      0, 0,
      bufferWidth, bufferHeight
    )
    */
    bgBuffer = buffer
  }
  
  const prepareReel = () => {
    const bufferWidth = slotSize
    const bufferHeight = slotSize * 9 * 2
    const buffer = createBuffer(bufferWidth, bufferHeight)

    const bCtx = buffer.getContext('2d')

    for (let symbolIndex = 0; symbolIndex < 9; symbolIndex++) {
      bCtx.drawImage(
        assets_backbuffers[`symbol_${symbolIndex}`],
        0, 0,
        assets_backbuffers[`symbol_${symbolIndex}`].width,
        assets_backbuffers[`symbol_${symbolIndex}`].height,
        0, slotSize * symbolIndex,
        slotSize, slotSize
      );
    }
    bCtx.drawImage(buffer, 0, slotSize * 9)
    reelBuffer = buffer
  }

  let _isInited = false
  const resizeCanvas = () => {
    const cW = can.width
    const bW = mainBackBuffer.width
    const bH = mainBackBuffer.height
    can.height = (bH * cW) / bW
  }
  const init = (options) => {
    const {
      canvasId,
      ownAssets,
      slotSize: _slotSize,
      isFixedCanvas: _isFixedCanvas,  // Размер канваса регулирует фронт (ширину - высота автоматом)
    } = {
      ownAssets: { images: [], sounds: [] },
      slotSize: 64,
      isFixedCanvas: true,
      ...options,
    }

    isFixedCanvas = _isFixedCanvas
    slotSize = _slotSize

    assets.images = {
      ...assets.images,
      ...ownAssets.images,
    }
    assets.sounds = {
      ...assets.sounds,
      ...ownAssets.sounds,
    }

    recalcRenderValues()
    
    can = document.getElementById(canvasId)
    


    preloadAssets(() => {
      if (assetsIsLoaded()) {
        prepareMainBackBuffer()
        prepareBg()
        prepareReel()
        prepareWinAnimation()
        if (isFixedCanvas) {
          resizeCanvas()
        } else {
          can.width = reel_area_width
          can.height = reel_area_height
        }
        ctx = can.getContext("2d")
        _isInited = true
        mainLoop()
      }
    })

  }

  window.SLOT_MACHINE = {
    init,
    spin,
    stop,
    resizeCanvas,
    render_winLine,
    render_reel,
    isInited: () => {
      return _isInited
    },
    markWinSlots,
    setSlotSize: (newSlotSize) => {
      slotSize = newSlotSize
      recalcRenderValues()
      if (isFixedCanvas) {
        resizeCanvas()
      } else {
        can.width = reel_area_width
        can.height = reel_area_height
      }
      prepareMainBackBuffer()
      prepareBg()
      prepareReel()
      prepareWinAnimation()
    },
    updateAssets: (ownAssets) => {
      console.log('>>> updateAssets', ownAssets)
      assets.images = {
        ...assets.images,
        ...ownAssets.images,
      }
      
      preloadAssets(() => {
        if (assetsIsLoaded()) {
          prepareMainBackBuffer()
          prepareBg()
          prepareReel()
          prepareWinAnimation()
        }
      })
    },
    setPreviewWinLines: (lineCount) => {
      previewWinLine = lineCount
    },
    setActiveWinLine: (lineNumber, slots) => {
      activeWinLine = lineNumber
      markWinSlots(lineNumber, slots)
      assets_sounds.win.currentTime = 0
      assets_sounds.win.play()
    },
    hideActiveWinLine: () => {
      activeWinLine = -1
      hideWinAnimation()
    },
    getMultiplers: () => {
      return slotMult
    },
    getFPS: () => {
      return fps
    }
  }
})()

