export interface AiProvider {
  name: string;
  generateScenePlan(prompt: string, catalogContext: string): Promise<string>;
}

export class MockAiProvider implements AiProvider {
  public readonly name = "Mock Builtin AI Planner";

  public async generateScenePlan(prompt: string, _catalogContext: string): Promise<string> {
    const lower = prompt.toLowerCase();

    // Contextual heuristics matching user's requests:
    // 1. Flight / Iron Man
    if (lower.includes("fly") || lower.includes("flight") || lower.includes("iron man")) {
      return JSON.stringify({
        title: "Iron Man Sky Patrol",
        synopsis: "Robot activates thrusters, ascends to hover altitude and patrols the jungle sanctuary",
        environmentAssetId: "env_jungle_waterfall",
        characters: [
          {
            characterId: "char_robot_main",
            assetId: "char_faceless_robot",
            name: "Faceless Kids Robot",
            initialAnchorOrPosition: [0, 0, 1.8],
          },
        ],
        shots: [
          {
            shotId: "shot_thruster_launch",
            name: "Thruster Ignition Launch",
            durationFrames: 60,
            cameraPreset: "low_angle",
            targetEntityId: "char_robot_main",
            description: "Dramatic low angle looking up as plasma boots ignite and lift off",
            actions: [
              {
                characterId: "char_robot_main",
                actionId: "fly",
                parameters: { altitude: 2.8 },
                dialogue: "Boot thrusters online! Initiating vertical liftoff.",
              },
            ],
          },
          {
            shotId: "shot_aerial_orbit",
            name: "Aerial Sky Patrol Orbit",
            durationFrames: 90,
            cameraPreset: "orbit",
            targetEntityId: "char_robot_main",
            description: "360-degree orbital sweep capturing high altitude hover and repulsor stabilization",
            actions: [
              {
                characterId: "char_robot_main",
                actionId: "fly",
                parameters: { altitude: 3.5 },
                dialogue: "Jungle sanctuary airspace clear.",
              },
            ],
          },
        ],
      }, null, 2);
    }

    // 2. Tree Climbing
    if (lower.includes("climb") || lower.includes("tree")) {
      return JSON.stringify({
        title: "Giant Mahogany Tree Ascent",
        synopsis: "Robot navigates to the tree base, climbs the mahogany trunk, and waves from the high branch",
        environmentAssetId: "env_jungle_waterfall",
        characters: [
          {
            characterId: "char_robot_main",
            assetId: "char_faceless_robot",
            name: "Faceless Kids Robot",
            initialAnchorOrPosition: [0, 0, 1.8],
          },
        ],
        shots: [
          {
            shotId: "shot_tree_approach",
            name: "Approaching Mahogany Tree",
            durationFrames: 90,
            cameraPreset: "tracking_side",
            targetEntityId: "char_robot_main",
            description: "Lateral tracking shot following robot as it walks to the base of the giant tree",
            actions: [
              {
                characterId: "char_robot_main",
                actionId: "walk_to",
                targetAnchorId: "tree_climb_start",
                parameters: { speed: 1.2 },
              },
            ],
          },
          {
            shotId: "shot_tree_climb",
            name: "Trunk Vertical Ascent",
            durationFrames: 120,
            cameraPreset: "reveal",
            targetEntityId: "char_robot_main",
            description: "Upward camera sweep tracking the hand-over-hand climbing progression",
            actions: [
              {
                characterId: "char_robot_main",
                actionId: "climb",
                targetAnchorId: "tree_climb_branch",
              },
            ],
          },
          {
            shotId: "shot_perch_wave",
            name: "Canopy Perch Wave",
            durationFrames: 75,
            cameraPreset: "close_up",
            targetEntityId: "char_robot_main",
            description: "Intimate framing of robot waving from the high canopy perch",
            actions: [
              {
                characterId: "char_robot_main",
                actionId: "wave",
                dialogue: "The view from this high canopy branch is spectacular!",
              },
            ],
          },
        ],
      }, null, 2);
    }

    // 3. Waterfall Shower
    if (lower.includes("shower") || lower.includes("water") || lower.includes("waterfall")) {
      return JSON.stringify({
        title: "Waterfall Splash Shower",
        synopsis: "Robot walks into the falling cascade stream, catching refreshing droplets under the waterfall",
        environmentAssetId: "env_jungle_waterfall",
        characters: [
          {
            characterId: "char_robot_main",
            assetId: "char_faceless_robot",
            name: "Faceless Kids Robot",
            initialAnchorOrPosition: [0, 0, 1.8],
          },
        ],
        shots: [
          {
            shotId: "shot_waterfall_walk",
            name: "Walking to Cascade Edge",
            durationFrames: 90,
            cameraPreset: "tracking_side",
            targetEntityId: "char_robot_main",
            description: "Tracking camera following robot walking toward the lagoon",
            actions: [
              {
                characterId: "char_robot_main",
                actionId: "walk_to",
                targetAnchorId: "waterfall_shower_spot",
                parameters: { speed: 1.0 },
              },
            ],
          },
          {
            shotId: "shot_waterfall_shower",
            name: "Cascade Water Shower",
            durationFrames: 120,
            cameraPreset: "medium",
            targetEntityId: "char_robot_main",
            description: "Medium shot capturing waterfall stream and water splash particles",
            actions: [
              {
                characterId: "char_robot_main",
                actionId: "take_shower",
                targetAnchorId: "waterfall_shower_spot",
                dialogue: "Nothing beats a cool shower under the jungle waterfall cascade!",
              },
            ],
          },
        ],
      }, null, 2);
    }

    // Default Walk & Wave plan
    return JSON.stringify({
      title: "Sanctuary Introduction",
      synopsis: "Robot walks to clearing center, greets the viewer with a friendly wave",
      environmentAssetId: "env_jungle_waterfall",
      characters: [
        {
          characterId: "char_robot_main",
          assetId: "char_faceless_robot",
          name: "Faceless Kids Robot",
          initialAnchorOrPosition: [0, 0, 1.8],
        },
      ],
      shots: [
        {
          shotId: "shot_intro_wide",
          name: "Opening Establishing Shot",
          durationFrames: 90,
          cameraPreset: "establishing_wide",
          targetEntityId: "char_robot_main",
          description: "High wide shot introducing character in the lush rainforest sanctuary",
          actions: [
            {
              characterId: "char_robot_main",
              actionId: "walk_to",
              targetAnchorId: "clearing_center",
              parameters: { speed: 1.0 },
            },
          ],
        },
        {
          shotId: "shot_intro_greeting",
          name: "Friendly Welcome Wave",
          durationFrames: 90,
          cameraPreset: "medium",
          targetEntityId: "char_robot_main",
          description: "Medium framing of robot giving a friendly wave",
          actions: [
            {
              characterId: "char_robot_main",
              actionId: "wave",
              dialogue: "Welcome to our 3D Sanctuary Animation Playground!",
            },
          ],
        },
      ],
    }, null, 2);
  }
}

export class HttpAiProvider implements AiProvider {
  public readonly name = "HTTP AI Endpoint (OpenAI / OpenRouter)";
  private endpoint: string;
  private apiKey: string;
  private model: string;

  constructor(endpoint: string, apiKey: string, model = "gpt-4o") {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.model = model;
  }

  public async generateScenePlan(prompt: string, catalogContext: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: catalogContext },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Provider request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
  }
}
