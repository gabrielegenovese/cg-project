const APPROX = 1;
const DEFLIGHTPOS = { x: 0, y: 100, z: 350 };
const DEFLIGHTDIR = { x: -1, y: 3, z: 5 };

const VS = `
	attribute vec4 a_position; 
	attribute vec2 a_texcoord; 		
	attribute vec3 a_normal; 
	attribute vec4 a_color; 
  
	uniform mat4 u_projection; 
	uniform mat4 u_view;      
	uniform mat4 u_world;    
	uniform vec3 u_lightPosition;  //point lighting
	uniform vec3 u_viewWorldPosition; 
	uniform vec3 u_lightWorldPosition;
	uniform mat4 u_worldInverseTranspose; //point lighting
  
	varying vec2 v_texcoord;        
	varying vec3 v_normal;	
	varying vec3 v_surfaceToView; 
	varying vec3 v_surfaceToLight; //point lighting
	varying vec4 v_color;  
  
	void main() {

	  vec4 worldPosition = u_world * a_position; 
	  gl_Position = u_projection * u_view * worldPosition; 
	  v_texcoord = a_texcoord; 
	  v_normal = mat3(u_worldInverseTranspose) * a_normal;  
	  // compute the world position of the surface
	  vec3 surfaceWorldPosition = (u_world * a_position).xyz; //point lighting
	  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition; //point lighting 
	  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition; //point lighting 
	  v_color = a_color; 		
	}
	`;

const FS = `
	precision highp float;

	varying vec2 v_texcoord;		
	varying vec3 v_normal;  			
	varying vec3 v_surfaceToView; 		
	varying vec4 v_color;				 
	varying vec3 v_surfaceToLight; //point lighting
	
	uniform vec3 diffuse;    			  	
	uniform vec3 ambient;				  
	uniform vec3 emissive;				  
	uniform vec3 specular;				  
	uniform vec3 u_lightDirection; 		  
	uniform vec3 u_ambientLight;          
	uniform vec3 u_reverseLightDirection; 
	uniform vec4 u_colorMult;
	uniform vec4 u_diffuse;  				

	uniform sampler2D diffuseMap;	
	uniform sampler2D specularMap;
	uniform sampler2D normalMap;

	uniform float opacity;
	uniform float shininess;
	uniform float u_bias;
	uniform float u_lightIntensity;
	uniform float u_shadowIntensity;
	
	void main () {
		vec3 normal = normalize(v_normal); 
		normal = texture2D(normalMap, v_texcoord).rgb * 2. - 1.;
		
		vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
		vec3 surfaceToViewDirection = normalize(v_surfaceToView);          		
		vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);   
		
		// compute the light by taking the dot product of the normal to the light's reverse direction
		float light = dot(v_normal, surfaceToLightDirection);                     
		float specularLight = dot(normal, halfVector);  				
		vec4 specularMapColor = texture2D(specularMap, v_texcoord);
		vec3 effectiveSpecular = specular * specularMapColor.rgb;
	
		vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);				
		vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;   
		float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;   	

		gl_FragColor = vec4(
			emissive +
			ambient * u_ambientLight +
			effectiveDiffuse * light +
			effectiveSpecular * pow(specularLight, shininess),
			effectiveOpacity);
	}
	`;
