import os
from PIL import Image

def remove_background():
    img_path = "LOGO @OUTLY.png"
    if not os.path.exists(img_path):
        print(f"Error: {img_path} not found in the current directory.")
        return
    
    img = Image.open(img_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # Check if the pixel is near white (R, G, B > 240)
        if item[0] > 240 and item[1] > 240 and item[2] > 245:
            # Make it fully transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Create assets directory if it doesn't exist
    os.makedirs("frontend/src/assets", exist_ok=True)
    
    # Save the transparent logo
    output_path = "frontend/src/assets/logo_transparent.png"
    img.save(output_path, "PNG")
    print(f"Success: Background removed and saved to {output_path}")

if __name__ == "__main__":
    remove_background()
