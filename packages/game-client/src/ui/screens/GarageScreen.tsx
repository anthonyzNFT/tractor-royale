import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

interface GarageScreenProps {
  onBack: () => void;
}

const BODY_PARTS = [
  { id: 'body_rust_bucket', name: 'Rust Bucket', cost: 0, color: '#8B4513' },
  { id: 'body_iron_horse', name: 'Iron Horse', cost: 500, color: '#4A4A4A' },
  { id: 'body_golden_bull', name: 'Golden Bull', cost: 2000, color: '#FFD700' },
];

const CAB_PARTS = [
  { id: 'cab_classic', name: 'Classic Cab', cost: 0 },
  { id: 'cab_modern', name: 'Modern Cab', cost: 300 },
  { id: 'cab_luxury', name: 'Luxury Cab', cost: 1500 },
];

const WHEEL_PARTS = [
  { id: 'wheels_tractor_standard', name: 'Standard Wheels', cost: 0 },
  { id: 'wheels_mud_grip', name: 'Mud Grip', cost: 400 },
  { id: 'wheels_racing', name: 'Racing Wheels', cost: 1800 },
];

export default function GarageScreen({ onBack }: GarageScreenProps) {
  const { profile, equipTractor, addHayBux } = useGameStore();
  const [selectedBody, setSelectedBody] = useState(profile.equippedTractor.bodyId);
  const [selectedCab, setSelectedCab] = useState(profile.equippedTractor.cabId);
  const [selectedWheels, setSelectedWheels] = useState(profile.equippedTractor.wheelsId);
  const [paintColor, setPaintColor] = useState(profile.equippedTractor.paintColor);

  const handleSave = () => {
    equipTractor({
      bodyId: selectedBody,
      cabId: selectedCab,
      wheelsId: selectedWheels,
      paintColor,
      paintMetalness: 0.3,
      paintRoughness: 0.7,
    });
    onBack();
  };

  const handlePurchase = (partId: string, cost: number) => {
    if (profile.hayBux >= cost) {
      addHayBux(-cost);
      alert('Part purchased!');
    } else {
      alert('Not enough Hay Bux!');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 z-10 overflow-auto">
      <div className="max-w-6xl w-full mx-4 my-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2">
            <h2 className="text-4xl font-display text-gray-800">🚜 GARAGE</h2>
            <button onClick={onBack} className="btn btn-secondary">
              ← Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Body</h3>
                <div className="space-y-2">
                  {BODY_PARTS.map((part) => (
                    <div
                      key={part.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedBody === part.id
                          ? 'border-primary bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedBody(part.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded"
                            style={{ backgroundColor: part.color }}
                          ></div>
                          <div>
                            <p className="font-bold">{part.name}</p>
                            <p className="text-sm text-gray-600">
                              {profile.ownedParts.includes(part.id) ? '✅ Owned' : `🌾 ${part.cost}`}
                            </p>
                          </div>
                        </div>
                        {!profile.ownedParts.includes(part.id) && part.cost > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(part.id, part.cost);
                            }}
                            className="btn btn-primary px-4 py-2 text-sm"
                            disabled={profile.hayBux < part.cost}
                          >
                            Buy
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Cab</h3>
                <div className="space-y-2">
                  {CAB_PARTS.map((part) => (
                    <div
                      key={part.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCab === part.id
                          ? 'border-primary bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedCab(part.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{part.name}</p>
                          <p className="text-sm text-gray-600">
                            {profile.ownedParts.includes(part.id) ? '✅ Owned' : `🌾 ${part.cost}`}
                          </p>
                        </div>
                        {!profile.ownedParts.includes(part.id) && part.cost > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(part.id, part.cost);
                            }}
                            className="btn btn-primary px-4 py-2 text-sm"
                            disabled={profile.hayBux < part.cost}
                          >
                            Buy
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Wheels</h3>
                <div className="space-y-2">
                  {WHEEL_PARTS.map((part) => (
                    <div
                      key={part.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedWheels === part.id
                          ? 'border-primary bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedWheels(part.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{part.name}</p>
                          <p className="text-sm text-gray-600">
                            {profile.ownedParts.includes(part.id) ? '✅ Owned' : `🌾 ${part.cost}`}
                          </p>
                        </div>
                        {!profile.ownedParts.includes(part.id) && part.cost > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(part.id, part.cost);
                            }}
                            className="btn btn-primary px-4 py-2 text-sm"
                            disabled={profile.hayBux < part.cost}
                          >
                            Buy
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-100 rounded-lg p-8 h-64 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl mb-4">🚜</p>
                  <p className="text-gray-600">Tractor Preview</p>
                  <p className="text-sm text-gray-500 mt-2">3D preview coming soon</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Paint Color</h3>
                <div className="flex gap-2 flex-wrap">
                  {['#8B4513', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#000000', '#FFFFFF'].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() => setPaintColor(color)}
                        className={`w-16 h-16 rounded-lg border-4 transition-all ${
                          paintColor === color ? 'border-primary scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      ></button>
                    )
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
                <p className="font-bold text-yellow-800 mb-2">💰 Your Balance</p>
                <p className="text-3xl font-bold text-yellow-600">🌾 {profile.hayBux}</p>
              </div>

              <button onClick={handleSave} className="btn btn-success w-full text-xl py-4">
                ✅ Save & Equip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
