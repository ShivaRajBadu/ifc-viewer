<template>
  <div class="viewer-container">
    <div
      ref="container"
      class="ifc-container"
      @drop.prevent="onDrop"
      @dragover.prevent
    >
      <div class="overlay">
        <label class="upload-label" for="file-upload">
          ↑ Drop or Upload IFC File
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".ifc"
          @change="onFileChange"
          class="file-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { IfcViewerAPI } from 'web-ifc-viewer'
import * as THREE from 'three'

const container = ref(null)
let viewer

onMounted(() => {
  viewer = new IfcViewerAPI({
    container: container.value,
    backgroundColor: new THREE.Color(0x202833)
  })

  viewer.IFC.setWasmPath('/wasm/')
  viewer.axes.setAxes()
  viewer.grid.setGrid()

  const size = 1000
  const divisions = 100
  const colorCenterLine = 0x444444
  const colorGrid = 0x202833

  const gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid)
  viewer.context.scene.add(gridHelper)

  viewer.context.ifcCamera.camera.position.set(30, 30, 30)
  viewer.context.ifcCamera.camera.lookAt(0, 0, 0)
  viewer.context.ifcCamera.cameraControls.update()
})

const onFileChange = async (event) => {
  const file = event.target.files[0]
  if (file) await loadIfcFile(file)
}

const onDrop = async (event) => {
  const file = event.dataTransfer.files[0]
  if (file) await loadIfcFile(file)
}

const loadIfcFile = async (file) => {
  const url = URL.createObjectURL(file)
  const model = await viewer.IFC.loadIfcUrl(url)

  viewer.context.ifcCamera.cameraControls.reset()
  viewer.context.ifcCamera.camera.position.set(30, 30, 30)
  viewer.context.ifcCamera.camera.lookAt(0, 0, 0)
  viewer.context.ifcCamera.cameraControls.update()

  window.onmousemove = async () => {
    const result = await viewer.IFC.selector.pickIfcItem()
    if (result) {
      const props = await viewer.IFC.getProperties(result.modelID, result.id, true)
      console.clear()
      console.log('Selected Element Properties:', props)
    }
  }
}
</script>

<style scoped>
.viewer-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #202833;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.ifc-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(32, 40, 51, 0.85);
  padding: 12px 18px;
  border-radius: 10px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.upload-label {
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
}

.upload-label:hover {
  color: #90caf9;
}

.file-input {
  display: none;
}
</style>
