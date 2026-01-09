;; Written by Will Braynen (June 2013)
;; Based on work done by Patrick Grim. (See "The Philosophy Computer",
;; Grim, Mar, and St. Denis, MIT Press, 1998.)
;;
;; This is NetLogo code, so to run it, you need to install NetLogo:
;; http://ccl.northwestern.edu/netlogo/
;; It's free. I recommend installing it and playing around with it and
;; this source code. NetLogo is the easiest programming environment
;; for agent-based modeling out there.

patches-own [
  ethnicity
  strategy
  new_strategy
  behavior
  cooperated
  defected
  score
]

globals [
  total_cooperated
  total_defected
  
  is_show_ethnicities
  is_segregated
]

;;  This procedure sets up the patches and patches
to setup
  clear-all
  reset-ticks
  init-global-counters
  
  ;; ethnicities and (de)segregation
  set is_show_ethnicities false;
  set is_segregated true;
  
  ;; Initialize all patches
  ask patches [ init-patch ]
  
  display-agents
  
end

to init-patch  ;; patch procedure
  init-patch-counters
  set strategy (random 9)
  
  ;; segregate by default.
  ;;  if you change your mind though, 
  ;;  then use this code instead: 
  ;;  "set ethnicity (random 2)"
  ifelse (pxcor < 0)
    [ set ethnicity 0 ]
    [ set ethnicity 1 ]
end

;; reset counters
to init-patch-counters  ;; patch procedure
  set score 0
  set cooperated 0
  set defected 0
end

;; maps ethnicity e1 to color
to-report etchnicity-to-color [ e1 ]
  if (0 = e1) [ report red ]
  if (1 = e1) [ report green ]
end

;; maps strategy s1 to color
to-report strategy-to-color [ s1 ]
  if (0 = s1) [ report green ]
  if (1 = s1) [ report cyan ]
  if (2 = s1) [ report red ]
  if (3 = s1) [ report magenta ]
  if (4 = s1) [ report yellow ]
  if (5 = s1) [ report 7 ]  ;; dark gray
  if (6 = s1) [ report 3 ]  ;; light gray
  if (7 = s1) [ report blue ]
  if (8 = s1) [ report 27 ] ;; light orange
end

to display-agents
  ifelse is_show_ethnicities
     [ ask patches [ set pcolor (etchnicity-to-color ethnicity) ]]
     [ ask patches [ set pcolor (strategy-to-color strategy) ]]
end

;;  This procedure makes the patches do stuff:
;; (1) patches will interact with their eight neighbors
;; (2) patches will imitate their most successful neighbor (taking on their strategy or behavior,
;;     depending on the model).  Neighborhood in which to look at the best score should be variable
;;     (i.e. nearest 4 neighbors, nearest 8 neighbors, nearest 16 neighbors, and so on till we
;;     get to global knowledge; could also do this with a royal family).
to go
  ;; patches interact
  ask patches [ play_with_neighbors ]
  
  ;; patches evolve
  ask patches [ evolve ]
  
  ;; Update patches' strategies
  ask patches [ set strategy new_strategy ]
  
  ;; Display the new strategies
  display-agents
  
  ;if (ticks > 30) [ stop ]
  init-global-counters
  ask patches [ count-total-cooperated ]
  my-update-plots
  tick
end ; go

to init-global-counters
  set total_cooperated 0
  set total_defected   0
end


;;;;;;;;;;;;;;
;;
;; Start the main chunk of code specific to ethnicities
;;

to show_ethnicities
  set is_show_ethnicities (not is_show_ethnicities) ; toggle
  ifelse is_show_ethnicities
     [ ask patches [ set pcolor (etchnicity-to-color ethnicity) ]]
     [ ask patches [ set pcolor (strategy-to-color strategy) ]]
end

to desegregate
  set is_segregated (not is_segregated) ; toggle
  ask patches [ init_ethnicity ]
  display-agents
end

; a patch changes its ethnicity
; (or moves, depending on your point of view)
to init_ethnicity
  ifelse is_segregated
     [ ifelse (pxcor < 0)
       [ set ethnicity 0 ]
       [ set ethnicity 1 ]]
     [ set ethnicity (random 2) ]

end

;;
;; End the main chunk of code specific to ethnicities
;;
;;;;;;;;;;;;;;



to my-update-plots
  ;; Strategies plot
  set-current-plot "Strategies"
  
  set-current-plot-pen "000 AllD"
  plot count patches with [strategy = 0]
  
  set-current-plot-pen "001"
  plot count patches with [strategy = 1]

  set-current-plot-pen "010 STFT"
  plot count patches with [strategy = 2]
  
  set-current-plot-pen "011"
  plot count patches with [strategy = 3]
  
  set-current-plot-pen "100" ;; C-then-AllD
  plot count patches with [strategy = 4]
  
  set-current-plot-pen "101"
  plot count patches with [strategy = 5]
  
  set-current-plot-pen "110 TFT"
  plot count patches with [strategy = 6]
  
  set-current-plot-pen "111 AllC"
  plot count patches with [strategy = 7]
  
  set-current-plot-pen "PTFT"
  plot count patches with [strategy = 8]   
  
  ;; Behavior plot
  set-current-plot "Behavior"
    
  set-current-plot-pen "C"
  plot total_cooperated
  
  set-current-plot-pen "D"
  plot total_defected
  
end ; update-plot

to count-total-cooperated ;; patch procedure
  ;; increment total_cooperated by the number of times the current patch cooperated
  set total_cooperated (total_cooperated + cooperated)
  set total_defected (total_defected + defected)
end

to play_with_neighbors ;; patch procedure
  init-patch-counters
  
  ;;
  ;; eight neighbors to play with
  ;;
  set score (play-with  0  1  ;      north
           + play-with  1  1  ; east-north (northeast)
           + play-with  1  0  ; east
           + play-with  1 -1  ; east-south (southeast)
           + play-with  0 -1  ;      south
           + play-with -1 -1  ; west-south (southwest)
           + play-with -1  0  ; west
           + play-with -1  1  ; west-north (northwest)
            )
  
end

to-report play-with [ x y ] ;; patch procedure 
  
  ;; what is my strategy?
  let s1 (my-strategy x y)
  let s2 (neighbor-strategy x y)
  
  report payoff s1 s2
end

;;
;; x and y are coordinates of the neighbor I want to play with
;;
to-report neighbor-strategy [ x y ]
  
  if (([strategy] of patch-at x y) != 8) ; I am not PTFT -- life is simple
     [ report ([strategy] of patch-at x y) ] 
  
  if (([strategy] of patch-at x y) = 8) ; I am PTFT -- life is complicated
     [ ifelse (([ethnicity] of patch-at x y) = ethnicity)
        [ report 6 ] ; I am the same ethnicity as my neighbor, so I am TFT (110 = 6)
        [ report 0 ] ; I am not the same ethnicity as my neighbor, so I am AllD (000 = 0)
     ]
        
end
     
;;
;; x and y are coordinates of the neighbor I want to play with
;;
to-report my-strategy [ x y ]
  
  if (strategy != 8) ; I am not PTFT -- life is simple
     [ report strategy ] 
  
  if (strategy = 8) ; I am PTFT -- life is complicated
     [ ifelse (ethnicity = ([ethnicity] of patch-at x y))
        [ report 6 ] ; I am the same ethnicity as my neighbor, so I am TFT (110 = 6)
        [ report 0 ] ; I am not the same ethnicity as my neighbor, so I am AllD (000 = 0)
     ]  
end

to evolve ;; patch procedure
 
  ;; Find fittest neighbor
  let fittest-neighbor max-one-of (patches in-radius imitation_radius) [score]
        
  ;; switch to the strategy/behavior of patch with highest score
  ;; if it's higher than yours. otherwise, keep your own!
  ifelse (score < [score] of fittest-neighbor) [
    ;; imitate-behavior-of-successful-neighbor
    set new_strategy ([strategy] of fittest-neighbor)
  ]
  [
    ;; keep your own!
    set new_strategy strategy
  ]
 
end




to increment_cooperated [ inc ]
  set cooperated (cooperated + inc)
  set defected (defected + (rounds_to_play - inc))
end


;; s1 is strategy1
;; s2 is strategy2
to-report payoff [ s1 s2 ]  ;; reporter  
  ;; 000
  if (s1 = 0) [ increment_cooperated (0) ]
  if (s1 = 0 and s2 = 0) [ report rounds_to_play * payoffs_dd ]
  if (s1 = 0 and s2 = 1) [ report payoffs_dd + (rounds_to_play - 1) * payoffs_dc ]
  if (s1 = 0 and s2 = 2) [ report rounds_to_play * payoffs_dd ]
  if (s1 = 0 and s2 = 3) [ report payoffs_dd + (rounds_to_play - 1) * payoffs_dc ]
  if (s1 = 0 and s2 = 4) [ report payoffs_dc + (rounds_to_play - 1) * payoffs_dd ]
  if (s1 = 0 and s2 = 5) [ report rounds_to_play * payoffs_dc ]
  if (s1 = 0 and s2 = 6) [ report payoffs_dc + (rounds_to_play - 1) * payoffs_dd ]
  if (s1 = 0 and s2 = 7) [ report rounds_to_play * payoffs_dc ]
  
  ;; 001
  if (s1 = 1 and s2 = 0) [ increment_cooperated (rounds_to_play - 2)  report payoffs_dd + (rounds_to_play - 1) * payoffs_cd ]
  if (s1 = 1 and s2 = 1) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 2) * payoffs_dd + (rounds_to_play / 2) * payoffs_cc ]
  if (s1 = 1 and s2 = 2) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 4) * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 1 and s2 = 3) [ increment_cooperated (1)    report payoffs_dd + payoffs_cc + (rounds_to_play - 2) * payoffs_dc ]
  if (s1 = 1 and s2 = 4) [ increment_cooperated (rounds_to_play - 2)  report payoffs_dc + payoffs_dd + (rounds_to_play - 2) * payoffs_cd ]
  if (s1 = 1 and s2 = 5) [ increment_cooperated (0)    report rounds_to_play * payoffs_dc ]
  if (s1 = 1 and s2 = 6) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 4) * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 1 and s2 = 7) [ increment_cooperated (0)    report rounds_to_play * payoffs_dc ]
    
  ;; 010
  if (s1 = 2 and s2 = 0) [ increment_cooperated (0)    report rounds_to_play * payoffs_dd ]
  if (s1 = 2 and s2 = 1) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 4) * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 2 and s2 = 2) [ increment_cooperated (0)    report rounds_to_play * payoffs_dd ]
  if (s1 = 2 and s2 = 3) [ increment_cooperated (rounds_to_play - 2)  report payoffs_dd + payoffs_dc + (rounds_to_play - 2) * payoffs_cc ]
  if (s1 = 2 and s2 = 4) [ increment_cooperated (1)    report payoffs_dc + payoffs_cd + (rounds_to_play - 2) * payoffs_dd ]
  if (s1 = 2 and s2 = 5) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 4) * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 2 and s2 = 6) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 2) * payoffs_dc + (rounds_to_play / 2) * payoffs_cd ]
  if (s1 = 2 and s2 = 7) [ increment_cooperated (rounds_to_play - 2)  report payoffs_dc + (rounds_to_play - 1) * payoffs_cc ]
  
  ;; 011
  if (s1 = 3) [ increment_cooperated (rounds_to_play - 1)   ]
  if (s1 = 3 and s2 = 0) [ report payoffs_dd + (rounds_to_play - 1) * payoffs_cd ]
  if (s1 = 3 and s2 = 1) [ report payoffs_dd + payoffs_cc + (rounds_to_play - 2) * payoffs_cd ]
  if (s1 = 3 and s2 = 2) [ report payoffs_dd + payoffs_cd + (rounds_to_play - 2) * payoffs_cc ]
  if (s1 = 3 and s2 = 3) [ report payoffs_dd + (rounds_to_play - 1) * payoffs_cc ]
  if (s1 = 3 and s2 = 4) [ report payoffs_dc + (rounds_to_play - 1) * payoffs_cd ]
  if (s1 = 3 and s2 = 5) [ report payoffs_dc + payoffs_cc + (rounds_to_play - 2) * payoffs_cd ]
  if (s1 = 3 and s2 = 6) [ report payoffs_dc + payoffs_cd + (rounds_to_play - 2) * payoffs_cc ]
  if (s1 = 3 and s2 = 7) [ report payoffs_dc + (rounds_to_play - 1) * payoffs_cc ]

  ;; 100
  if (s1 = 4) [ increment_cooperated (1) ]
  if (s1 = 4 and s2 = 0) [ report payoffs_cd + (rounds_to_play - 1) * payoffs_dd ]
  if (s1 = 4 and s2 = 1) [ report payoffs_cd + payoffs_dd + (rounds_to_play - 2) * payoffs_dc ]
  if (s1 = 4 and s2 = 2) [ report payoffs_cd + payoffs_dc + (rounds_to_play - 2) * payoffs_dd ]
  if (s1 = 4 and s2 = 3) [ report payoffs_cd + (rounds_to_play - 1) * payoffs_dc ]
  if (s1 = 4 and s2 = 4) [ report payoffs_cc + (rounds_to_play - 1) * payoffs_dd ]
  if (s1 = 4 and s2 = 5) [ report payoffs_cc + payoffs_dd + (rounds_to_play - 2) * payoffs_dc ]
  if (s1 = 4 and s2 = 6) [ report payoffs_cc + payoffs_dc + (rounds_to_play - 2) * payoffs_dd ]
  if (s1 = 4 and s2 = 7) [ report payoffs_cc + (rounds_to_play - 1) * payoffs_dc ]

  ;; 101
  if (s1 = 5 and s2 = 0) [ increment_cooperated (rounds_to_play)  report rounds_to_play * payoffs_cd ]
  if (s1 = 5 and s2 = 1) [ increment_cooperated (rounds_to_play)  report rounds_to_play * payoffs_cd ]
  if (s1 = 5 and s2 = 2) [ increment_cooperated (rounds_to_play / 2)  report 50 * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 5 and s2 = 3) [ increment_cooperated (2)    report payoffs_cd + payoffs_cc + (rounds_to_play - 2) * payoffs_dc ]
  if (s1 = 5 and s2 = 4) [ increment_cooperated (rounds_to_play - 2)  report payoffs_cc + payoffs_dd + (rounds_to_play - 2) * payoffs_cd ]
  if (s1 = 5 and s2 = 5) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 2) * payoffs_cc + (rounds_to_play / 2) * payoffs_dd ]
  if (s1 = 5 and s2 = 6) [ increment_cooperated (rounds_to_play / 2)  report 50 * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 5 and s2 = 7) [ increment_cooperated (1)    report payoffs_cc + (rounds_to_play - 1) * payoffs_dc ]

  ;; 110
  if (s1 = 6 and s2 = 0) [ increment_cooperated (1)    report payoffs_cd + (rounds_to_play - 1) * payoffs_dd ]
  if (s1 = 6 and s2 = 1) [ increment_cooperated (rounds_to_play / 2)  report 50 * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 6 and s2 = 2) [ increment_cooperated (rounds_to_play / 2)  report (rounds_to_play / 2) * payoffs_cd + (rounds_to_play / 2) * payoffs_dc ]
  if (s1 = 6 and s2 = 3) [ increment_cooperated (rounds_to_play - 1)  report payoffs_cd + payoffs_dc + (rounds_to_play - 2) * payoffs_cc ]
  if (s1 = 6 and s2 = 4) [ increment_cooperated (2)    report payoffs_cc + payoffs_cd + (rounds_to_play - 2) * payoffs_dd ]
  if (s1 = 6 and s2 = 5) [ increment_cooperated (rounds_to_play / 2)  report 50 * (payoffs_cc + payoffs_cd + payoffs_dc + payoffs_dd) ]
  if (s1 = 6 and s2 = 6) [ increment_cooperated (rounds_to_play)  report rounds_to_play * payoffs_cc ]
  if (s1 = 6 and s2 = 7) [ increment_cooperated (rounds_to_play)  report rounds_to_play * payoffs_cc ]

  ;; 111
  if (s1 = 7) [ increment_cooperated (rounds_to_play) ]
  if (s1 = 7 and s2 = 0) [ report rounds_to_play * payoffs_cd ]
  if (s1 = 7 and s2 = 1) [ report rounds_to_play * payoffs_cd ]
  if (s1 = 7 and s2 = 2) [ report payoffs_cd + (rounds_to_play - 1) * payoffs_cc ]
  if (s1 = 7 and s2 = 3) [ report payoffs_cd + (rounds_to_play - 1) * payoffs_cc ]
  if (s1 = 7 and s2 = 4) [ report payoffs_cc + (rounds_to_play - 1) * payoffs_cd ]
  if (s1 = 7 and s2 = 5) [ report payoffs_cc + (rounds_to_play - 1) * payoffs_cd ]
  if (s1 = 7 and s2 = 6) [ report rounds_to_play * payoffs_cc ]
  if (s1 = 7 and s2 = 7) [ report rounds_to_play * payoffs_cc ]
  
end
@#$#@#$#@
GRAPHICS-WINDOW
259
14
724
500
32
32
7.0
1
10
1
1
1
0
1
1
1
-32
32
-32
32
0
0
1
ticks
30.0

BUTTON
53
29
116
62
NIL
setup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

BUTTON
163
30
226
63
NIL
go
T
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

SLIDER
759
14
931
47
payoffs_cc
payoffs_cc
0
10
3
1
1
NIL
HORIZONTAL

SLIDER
760
50
932
83
payoffs_cd
payoffs_cd
0
10
0
1
1
NIL
HORIZONTAL

SLIDER
761
86
933
119
payoffs_dc
payoffs_dc
0
10
5
1
1
NIL
HORIZONTAL

SLIDER
762
123
934
156
payoffs_dd
payoffs_dd
0
10
1
1
1
NIL
HORIZONTAL

PLOT
761
170
961
369
Strategies
tick
strategies
0.0
30.0
0.0
5000.0
true
true
"" ""
PENS
"000 AllD" 1.0 0 -10899396 true "" ""
"001" 1.0 0 -11221820 true "" ""
"010 STFT" 1.0 0 -2674135 true "" ""
"011" 1.0 0 -5825686 true "" ""
"100" 1.0 0 -1184463 true "" ""
"101" 1.0 0 -4539718 true "" ""
"110 TFT" 1.0 0 -11053225 true "" ""
"111 AllC" 1.0 0 -13345367 true "" ""
"PTFT" 1.0 0 -612749 true "" ""

PLOT
761
375
961
525
Behavior
tick
moves
0.0
30.0
0.0
3000000.0
true
true
"" ""
PENS
"C" 1.0 0 -13345367 true "" ""
"D" 1.0 0 -10899396 true "" ""

SLIDER
52
415
224
448
rounds_to_play
rounds_to_play
4
200
200
4
1
NIL
HORIZONTAL

SLIDER
54
370
232
403
imitation_radius
imitation_radius
1
3
1.5
0.5
1
agents
HORIZONTAL

BUTTON
86
187
197
220
(de)segragate
desegregate
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

BUTTON
88
147
196
180
toggle display
show_ethnicities
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

@#$#@#$#@
## WHAT IS IT?

This is an agent-based model of neighbor interactions which uses evolutionary game-theory.  It has implications for biology, sociology, social psychology, and social and political philosophy.

## HOW IT WORKS

Agents (the little squares that don't go anywhere) are born with one of eight possible reactive strategies.  Which strategy they get is determined purely by chance. interact with their neighbors one at a time, sum up the points they get from these interactions, and then see if any of their neighbors did better than they did.

## HOW TO USE IT

This section could explain how to use the model, including a description of each of the items in the interface tab.

## THINGS TO NOTICE

Notice that with default payoff values (Axelrod's prisoner's dilemma payoffs of 0,1,3,5), tit-for-tat (TFT) wins out.

## THINGS TO TRY

This section could give some ideas of things for the user to try to do (move sliders, switches, etc.) with the model.

## EXTENDING THE MODEL

This section could give some ideas of things to add or change in the procedures tab to make the model more complicated, detailed, accurate, etc.

## NETLOGO FEATURES

This section could point out any especially interesting or unusual features of NetLogo that the model makes use of, particularly in the Procedures tab.  It might also point out places where workarounds were needed because of missing features.

## RELATED MODELS

This section could give the names of models in the NetLogo Models Library or elsewhere which are of related interest.

## CREDITS AND REFERENCES

Patrick Grim, "The Greater Generosity of the Spatialized Prisoner's Dilemma," Journal of Theoretical Biology 173 (1995), 353-359

Patrick Grim, "Spatialization and Greater Generosity in the Stochastic Prisoner's Dilemma," BioSystems 37 (1996), 3-17.

Patrick Grim, Gary Mar, and Paul St. Denis, The Philosophical Computer.  MIT Press, 1998.

http://www.sunysb.edu/philosophy/faculty/pgrim/index.html  
http://www.computationalphilosophy.org/

This NetLogo code was written by Will Braynen (July 2007)
@#$#@#$#@
default
true
0
Polygon -7500403 true true 150 5 40 250 150 205 260 250

airplane
true
0
Polygon -7500403 true true 150 0 135 15 120 60 120 105 15 165 15 195 120 180 135 240 105 270 120 285 150 270 180 285 210 270 165 240 180 180 285 195 285 165 180 105 180 60 165 15

arrow
true
0
Polygon -7500403 true true 150 0 0 150 105 150 105 293 195 293 195 150 300 150

box
false
0
Polygon -7500403 true true 150 285 285 225 285 75 150 135
Polygon -7500403 true true 150 135 15 75 150 15 285 75
Polygon -7500403 true true 15 75 15 225 150 285 150 135
Line -16777216 false 150 285 150 135
Line -16777216 false 150 135 15 75
Line -16777216 false 150 135 285 75

bug
true
0
Circle -7500403 true true 96 182 108
Circle -7500403 true true 110 127 80
Circle -7500403 true true 110 75 80
Line -7500403 true 150 100 80 30
Line -7500403 true 150 100 220 30

butterfly
true
0
Polygon -7500403 true true 150 165 209 199 225 225 225 255 195 270 165 255 150 240
Polygon -7500403 true true 150 165 89 198 75 225 75 255 105 270 135 255 150 240
Polygon -7500403 true true 139 148 100 105 55 90 25 90 10 105 10 135 25 180 40 195 85 194 139 163
Polygon -7500403 true true 162 150 200 105 245 90 275 90 290 105 290 135 275 180 260 195 215 195 162 165
Polygon -16777216 true false 150 255 135 225 120 150 135 120 150 105 165 120 180 150 165 225
Circle -16777216 true false 135 90 30
Line -16777216 false 150 105 195 60
Line -16777216 false 150 105 105 60

car
false
0
Polygon -7500403 true true 300 180 279 164 261 144 240 135 226 132 213 106 203 84 185 63 159 50 135 50 75 60 0 150 0 165 0 225 300 225 300 180
Circle -16777216 true false 180 180 90
Circle -16777216 true false 30 180 90
Polygon -16777216 true false 162 80 132 78 134 135 209 135 194 105 189 96 180 89
Circle -7500403 true true 47 195 58
Circle -7500403 true true 195 195 58

circle
false
0
Circle -7500403 true true 0 0 300

circle 2
false
0
Circle -7500403 true true 0 0 300
Circle -16777216 true false 30 30 240

cow
false
0
Polygon -7500403 true true 200 193 197 249 179 249 177 196 166 187 140 189 93 191 78 179 72 211 49 209 48 181 37 149 25 120 25 89 45 72 103 84 179 75 198 76 252 64 272 81 293 103 285 121 255 121 242 118 224 167
Polygon -7500403 true true 73 210 86 251 62 249 48 208
Polygon -7500403 true true 25 114 16 195 9 204 23 213 25 200 39 123

cylinder
false
0
Circle -7500403 true true 0 0 300

dot
false
0
Circle -7500403 true true 90 90 120

face happy
false
0
Circle -7500403 true true 8 8 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Polygon -16777216 true false 150 255 90 239 62 213 47 191 67 179 90 203 109 218 150 225 192 218 210 203 227 181 251 194 236 217 212 240

face neutral
false
0
Circle -7500403 true true 8 7 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Rectangle -16777216 true false 60 195 240 225

face sad
false
0
Circle -7500403 true true 8 8 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Polygon -16777216 true false 150 168 90 184 62 210 47 232 67 244 90 220 109 205 150 198 192 205 210 220 227 242 251 229 236 206 212 183

fish
false
0
Polygon -1 true false 44 131 21 87 15 86 0 120 15 150 0 180 13 214 20 212 45 166
Polygon -1 true false 135 195 119 235 95 218 76 210 46 204 60 165
Polygon -1 true false 75 45 83 77 71 103 86 114 166 78 135 60
Polygon -7500403 true true 30 136 151 77 226 81 280 119 292 146 292 160 287 170 270 195 195 210 151 212 30 166
Circle -16777216 true false 215 106 30

flag
false
0
Rectangle -7500403 true true 60 15 75 300
Polygon -7500403 true true 90 150 270 90 90 30
Line -7500403 true 75 135 90 135
Line -7500403 true 75 45 90 45

flower
false
0
Polygon -10899396 true false 135 120 165 165 180 210 180 240 150 300 165 300 195 240 195 195 165 135
Circle -7500403 true true 85 132 38
Circle -7500403 true true 130 147 38
Circle -7500403 true true 192 85 38
Circle -7500403 true true 85 40 38
Circle -7500403 true true 177 40 38
Circle -7500403 true true 177 132 38
Circle -7500403 true true 70 85 38
Circle -7500403 true true 130 25 38
Circle -7500403 true true 96 51 108
Circle -16777216 true false 113 68 74
Polygon -10899396 true false 189 233 219 188 249 173 279 188 234 218
Polygon -10899396 true false 180 255 150 210 105 210 75 240 135 240

house
false
0
Rectangle -7500403 true true 45 120 255 285
Rectangle -16777216 true false 120 210 180 285
Polygon -7500403 true true 15 120 150 15 285 120
Line -16777216 false 30 120 270 120

leaf
false
0
Polygon -7500403 true true 150 210 135 195 120 210 60 210 30 195 60 180 60 165 15 135 30 120 15 105 40 104 45 90 60 90 90 105 105 120 120 120 105 60 120 60 135 30 150 15 165 30 180 60 195 60 180 120 195 120 210 105 240 90 255 90 263 104 285 105 270 120 285 135 240 165 240 180 270 195 240 210 180 210 165 195
Polygon -7500403 true true 135 195 135 240 120 255 105 255 105 285 135 285 165 240 165 195

line
true
0
Line -7500403 true 150 0 150 300

line half
true
0
Line -7500403 true 150 0 150 150

link
true
0
Line -7500403 true 150 0 150 300

link direction
true
0
Line -7500403 true 150 150 30 225
Line -7500403 true 150 150 270 225

pentagon
false
0
Polygon -7500403 true true 150 15 15 120 60 285 240 285 285 120

person
false
0
Circle -7500403 true true 110 5 80
Polygon -7500403 true true 105 90 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285 180 195 195 90
Rectangle -7500403 true true 127 79 172 94
Polygon -7500403 true true 195 90 240 150 225 180 165 105
Polygon -7500403 true true 105 90 60 150 75 180 135 105

plant
false
0
Rectangle -7500403 true true 135 90 165 300
Polygon -7500403 true true 135 255 90 210 45 195 75 255 135 285
Polygon -7500403 true true 165 255 210 210 255 195 225 255 165 285
Polygon -7500403 true true 135 180 90 135 45 120 75 180 135 210
Polygon -7500403 true true 165 180 165 210 225 180 255 120 210 135
Polygon -7500403 true true 135 105 90 60 45 45 75 105 135 135
Polygon -7500403 true true 165 105 165 135 225 105 255 45 210 60
Polygon -7500403 true true 135 90 120 45 150 15 180 45 165 90

square
false
0
Rectangle -7500403 true true 30 30 270 270

square 2
false
0
Rectangle -7500403 true true 30 30 270 270
Rectangle -16777216 true false 60 60 240 240

star
false
0
Polygon -7500403 true true 151 1 185 108 298 108 207 175 242 282 151 216 59 282 94 175 3 108 116 108

target
false
0
Circle -7500403 true true 0 0 300
Circle -16777216 true false 30 30 240
Circle -7500403 true true 60 60 180
Circle -16777216 true false 90 90 120
Circle -7500403 true true 120 120 60

tree
false
0
Circle -7500403 true true 118 3 94
Rectangle -6459832 true false 120 195 180 300
Circle -7500403 true true 65 21 108
Circle -7500403 true true 116 41 127
Circle -7500403 true true 45 90 120
Circle -7500403 true true 104 74 152

triangle
false
0
Polygon -7500403 true true 150 30 15 255 285 255

triangle 2
false
0
Polygon -7500403 true true 150 30 15 255 285 255
Polygon -16777216 true false 151 99 225 223 75 224

truck
false
0
Rectangle -7500403 true true 4 45 195 187
Polygon -7500403 true true 296 193 296 150 259 134 244 104 208 104 207 194
Rectangle -1 true false 195 60 195 105
Polygon -16777216 true false 238 112 252 141 219 141 218 112
Circle -16777216 true false 234 174 42
Rectangle -7500403 true true 181 185 214 194
Circle -16777216 true false 144 174 42
Circle -16777216 true false 24 174 42
Circle -7500403 false true 24 174 42
Circle -7500403 false true 144 174 42
Circle -7500403 false true 234 174 42

turtle
true
0
Polygon -10899396 true false 215 204 240 233 246 254 228 266 215 252 193 210
Polygon -10899396 true false 195 90 225 75 245 75 260 89 269 108 261 124 240 105 225 105 210 105
Polygon -10899396 true false 105 90 75 75 55 75 40 89 31 108 39 124 60 105 75 105 90 105
Polygon -10899396 true false 132 85 134 64 107 51 108 17 150 2 192 18 192 52 169 65 172 87
Polygon -10899396 true false 85 204 60 233 54 254 72 266 85 252 107 210
Polygon -7500403 true true 119 75 179 75 209 101 224 135 220 225 175 261 128 261 81 224 74 135 88 99

wheel
false
0
Circle -7500403 true true 3 3 294
Circle -16777216 true false 30 30 240
Line -7500403 true 150 285 150 15
Line -7500403 true 15 150 285 150
Circle -7500403 true true 120 120 60
Line -7500403 true 216 40 79 269
Line -7500403 true 40 84 269 221
Line -7500403 true 40 216 269 79
Line -7500403 true 84 40 221 269

x
false
0
Polygon -7500403 true true 270 75 225 30 30 225 75 270
Polygon -7500403 true true 30 75 75 30 270 225 225 270

@#$#@#$#@
NetLogo 5.1.0
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
default
0.0
-0.2 0 0.0 1.0
0.0 1 1.0 0.0
0.2 0 0.0 1.0
link direction
true
0
Line -7500403 true 150 150 90 180
Line -7500403 true 150 150 210 180

@#$#@#$#@
0
@#$#@#$#@
