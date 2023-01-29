(() => {

  // html elements
  let can     // canvas
  let ctx     // context


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
      reels_bg: `_MYAPP/vendor/images/reels_bg.png`,
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
  const reel_position = [0 * symbol_size, 1 * symbol_size, 6 * symbol_size, 8 * symbol_size, 5 * symbol_size]
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
    const sW = symbol_size
    const aH = assets_backbuffers.win_animation.height
    
    //console.log(a)
    for (let reelRow = 0; reelRow < 3; reelRow++) {
      for (let reelCol = 0; reelCol < 5; reelCol++) {
        if (winCombination[reelRow][reelCol]) {
          ctx.drawImage(
            assets_backbuffers.win_animation,
            winAnimationFrame * aH,
            0,
            aH, aH,
            reelCol * symbol_size,
            reelRow * symbol_size,
            symbol_size,
            symbol_size
          )
        }
      }
    }
    
  }

  const draw_symbol = (symbol_index, x, y) => {
    if (!reelBuffer) return
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

    render_winAnimation()

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

/*    
    if (
      game_state == STATE_SPINUP || game_state == STATE_SPINDOWN
      || previewWinLine != -1
      || activeWinLine != -1
    ) {
      */
      
      render_reel()
    //}
    
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

  let _isInited = false
  const init = (options) => {
    const {
      canvasId,
      ownAssets
    } = {
      ownAssets: { images: [], sounds: [] },
      ...options,
    }
    assets.images = {
      ...assets.images,
      ...ownAssets.images,
    }
    assets.sounds = {
      ...assets.sounds,
      ...ownAssets.sounds,
    }
    can = document.getElementById(canvasId)
    can.width = reel_area_width
    can.height = reel_area_height
    ctx = can.getContext("2d")


    preloadAssets(() => {
      if (assetsIsLoaded()) {
        prepareReel()
        //render_reel()
        _isInited = true
        mainLoop()
      }
    })

  }

  window.SLOT_MACHINE = {
    init,
    spin,
    stop,
    render_winLine,
    render_reel,
    isInited: () => {
      return _isInited
    },
    markWinSlots,
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
    getFPS: () => {
      return fps
    }
  }
})()

