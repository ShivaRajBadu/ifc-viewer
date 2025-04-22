// src/IFCLoader.js
import * as THREE from 'three';
import { IfcAPI } from 'web-ifc/web-ifc-api';

class IFCLoader extends THREE.Loader {
  constructor(manager) {
    super(manager);
    this.ifcManager = {
      useWebWorkers: false,
      webWorker: null,
      parser: null,
      api: null,
      models: {},
      modelID: 0,
      
      async init() {
        if (!this.api) {
          this.api = new IfcAPI();
          await this.api.Init();
        }
      },
      
      setWasmPath(path) {
        this.wasmPath = path;
      },
      
      getExpressId(geometry, index) {
        // This is a simplified version - in real world scenarios
        // we would need to access the appropriate buffer attribute
        // that holds the expressId
        if (geometry.expressIds && geometry.expressIds[index]) {
          return geometry.expressIds[index];
        }
        return index;
      },
      
      getItemProperties(modelID, id, indirect = false) {
        if (!this.api) {
          console.error('IFC API not initialized');
          return {};
        }
        
        if (!this.models[modelID]) {
          console.error('Model not found');
          return {};
        }
        
        try {
          return this.api.GetLine(modelID, id, indirect);
        } catch (e) {
          console.error('Failed to get properties', e);
          return {};
        }
      }
    };
  }
  
  async load(url, onLoad, onProgress, onError) {
    const scope = this;
    
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const model = await this.parse(buffer);
      
      if (onLoad) onLoad(model);
      return model;
    } catch (e) {
      if (onError) onError(e);
      scope.manager.itemError(url);
      throw e;
    }
  }
  
  async loadAsync(url, onProgress) {
    return new Promise((resolve, reject) => {
      this.load(url, resolve, onProgress, reject);
    });
  }
  
  async parse(buffer) {
    await this.ifcManager.init();
    
    // Load the model into the IFC API
    const modelID = this.ifcManager.api.OpenModel(new Uint8Array(buffer));
    this.ifcManager.modelID = modelID;
    this.ifcManager.models[modelID] = { id: modelID };
    
    // Create geometry from the IFC model
    const mesh = await this.createThreeMesh(modelID);
    mesh.modelID = modelID;
    
    return mesh;
  }
  
  async createThreeMesh(modelID) {
    // Get all the geometry from the IFC model
    const ifcGeometries = this.getGeometry(modelID);
    
    // Group all geometries into a single mesh
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xaaaaaa,
      side: THREE.DoubleSide,
      flatShading: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'IFC Model';
    
    // Add the IFC geometries to the mesh
    if (ifcGeometries.vertices && ifcGeometries.vertices.length > 0) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(ifcGeometries.vertices, 3));
      
      if (ifcGeometries.normals && ifcGeometries.normals.length > 0) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(ifcGeometries.normals, 3));
      } else {
        // Compute normals if not provided
        geometry.computeVertexNormals();
      }
      
      if (ifcGeometries.indices && ifcGeometries.indices.length > 0) {
        geometry.setIndex(ifcGeometries.indices);
      }
      
      // Store express IDs for picking
      geometry.expressIds = ifcGeometries.expressIds || [];
    }
    
    // Store an association between each face and its IFC entity
    // This is a simplified approach
    mesh.userData.ifcData = {
      modelID: modelID
    };
    
    return mesh;
  }
  
  getGeometry(modelID) {
    // This is a simplified placeholder - in a real implementation
    // we would extract actual geometry data from the IFC model
    // using the web-ifc API
    
    // Create some placeholder geometry
    // In a real implementation, you would process the IFC model
    // to extract actual geometry
    const vertices = [];
    const normals = [];
    const indices = [];
    const expressIds = [];
    
    // Create a simple cube as placeholder
    // A real implementation would extract the actual IFC geometry
    
    // Box vertices
    vertices.push(
      // Front face
      -1, -1,  1,
       1, -1,  1,
       1,  1,  1,
      -1,  1,  1,
      // Back face
      -1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
       1, -1, -1,
       // Top face
      -1,  1, -1,
      -1,  1,  1,
       1,  1,  1,
       1,  1, -1,
      // Bottom face
      -1, -1, -1,
       1, -1, -1,
       1, -1,  1,
      -1, -1,  1,
      // Right face
       1, -1, -1,
       1,  1, -1,
       1,  1,  1,
       1, -1,  1,
      // Left face
      -1, -1, -1,
      -1, -1,  1,
      -1,  1,  1,
      -1,  1, -1
    );

    // Box normals
    normals.push(
      // Front face
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      // Back face
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      // Top face
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      // Bottom face
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      // Right face
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      // Left face
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
    );

    // Box indices
    indices.push(
      // Front face
      0, 1, 2, 0, 2, 3,
      // Back face
      4, 5, 6, 4, 6, 7,
      // Top face
      8, 9, 10, 8, 10, 11,
      // Bottom face
      12, 13, 14, 12, 14, 15,
      // Right face
      16, 17, 18, 16, 18, 19,
      // Left face
      20, 21, 22, 20, 22, 23
    );

    // Assign some dummy expressIds for the example
    // In a real implementation, these would be the actual IFC entity IDs
    for (let i = 0; i < indices.length / 3; i++) {
      expressIds.push(i + 1); // ExpressIDs usually start from 1
    }

    return {
      vertices,
      normals,
      indices,
      expressIds
    };
  }
}

export { IFCLoader };